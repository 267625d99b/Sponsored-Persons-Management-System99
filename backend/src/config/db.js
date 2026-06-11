const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// تحديد مسار البيانات - يدعم بيئة Electron و Render و غيرها
const baseDataPath = process.env.ELECTRON_DATA_PATH || 
                     process.env.RENDER_DATA_PATH ||
                     path.join(__dirname, '../../');
const dbPath = path.join(baseDataPath, 'data/sponsorship.db');
const dataDir = path.dirname(dbPath);
const backupsDir = path.join(baseDataPath, 'backups');
const uploadsDir = path.join(baseDataPath, 'uploads');

[dataDir, backupsDir, uploadsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

let db = null;

// دالة لمساندة الاستعلامات باستخدام Promises
const dbRun = (query, params = []) => new Promise((resolve, reject) => {
  db.run(query, params, function(err) {
    if (err) reject(err);
    else resolve(this);
  });
});

const dbGet = (query, params = []) => new Promise((resolve, reject) => {
  db.get(query, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

const dbAll = (query, params = []) => new Promise((resolve, reject) => {
  db.all(query, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

const tableHasColumn = async (table, column) => {
  const columns = await dbAll(`PRAGMA table_info(${table})`);
  return columns.some(c => c.name === column);
};

const addColumnIfMissing = async (table, column, definition) => {
  if (!(await tableHasColumn(table, column))) {
    await dbRun(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
};

const getDefaultTenantId = async () => {
  const admin = await dbGet(`
    SELECT id, tenant_id
    FROM admins
    WHERE role != 'superadmin'
    ORDER BY id DESC
    LIMIT 1
  `);

  if (admin) return admin.tenant_id || admin.id;

  const superAdmin = await dbGet(`SELECT id FROM admins ORDER BY id ASC LIMIT 1`);
  return superAdmin ? superAdmin.id : null;
};

const repairTenantData = async () => {
  const defaultTenantId = await getDefaultTenantId();
  if (!defaultTenantId) return;

  await dbRun(`UPDATE admins SET tenant_id = id WHERE role != 'superadmin' AND tenant_id IS NULL`);

  const orphanTenants = await dbAll(`
    SELECT DISTINCT tenant_id
    FROM sponsored
    WHERE tenant_id IS NOT NULL
      AND tenant_id NOT IN (SELECT tenant_id FROM admins WHERE tenant_id IS NOT NULL)
  `);

  for (const row of orphanTenants) {
    await dbRun(`UPDATE sponsored SET tenant_id = ? WHERE tenant_id = ?`, [defaultTenantId, row.tenant_id]);
    await dbRun(`UPDATE payments SET tenant_id = ? WHERE tenant_id = ?`, [defaultTenantId, row.tenant_id]);
    await dbRun(`UPDATE documents SET tenant_id = ? WHERE tenant_id = ?`, [defaultTenantId, row.tenant_id]);
    await dbRun(`UPDATE activity_logs SET tenant_id = ? WHERE tenant_id = ?`, [defaultTenantId, row.tenant_id]);
    await dbRun(`UPDATE notifications SET tenant_id = ? WHERE tenant_id = ?`, [defaultTenantId, row.tenant_id]);
    await dbRun(`UPDATE backups SET tenant_id = ? WHERE tenant_id = ?`, [defaultTenantId, row.tenant_id]);
    await dbRun(`UPDATE settings SET tenant_id = ? WHERE tenant_id = ?`, [defaultTenantId, row.tenant_id]);
  }

  for (const table of ['sponsored', 'payments', 'documents', 'activity_logs', 'notifications', 'backups', 'settings']) {
    await dbRun(`UPDATE ${table} SET tenant_id = ? WHERE tenant_id IS NULL`, [defaultTenantId]);
  }
};

const dedupeSettings = async () => {
  const duplicateTenants = await dbAll(`
    SELECT tenant_id
    FROM settings
    WHERE tenant_id IS NOT NULL
    GROUP BY tenant_id
    HAVING COUNT(*) > 1
  `);

  for (const row of duplicateTenants) {
    await dbRun(`
      DELETE FROM settings
      WHERE tenant_id = ?
        AND id NOT IN (
          SELECT id FROM settings
          WHERE tenant_id = ?
          ORDER BY updated_at DESC, id DESC
          LIMIT 1
        )
    `, [row.tenant_id, row.tenant_id]);
  }
};

const dedupeSponsoredIdNumbers = async () => {
  const duplicates = await dbAll(`
    SELECT tenant_id, id_number, COUNT(*) as count
    FROM sponsored
    GROUP BY tenant_id, id_number
    HAVING COUNT(*) > 1
  `);

  for (const duplicate of duplicates) {
    const rows = await dbAll(`
      SELECT id
      FROM sponsored
      WHERE tenant_id = ? AND id_number = ?
      ORDER BY id ASC
    `, [duplicate.tenant_id, duplicate.id_number]);

    for (const row of rows.slice(1)) {
      await dbRun(
        `UPDATE sponsored SET id_number = ? WHERE id = ?`,
        [`${duplicate.id_number}-${row.id}`, row.id]
      );
    }
  }
};

const rebuildSponsoredTableIfNeeded = async () => {
  const table = await dbGet(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'sponsored'`);
  if (!table?.sql || !/id_number\s+TEXT\s+UNIQUE/i.test(table.sql)) return;

  await dedupeSponsoredIdNumbers();
  await dbRun('PRAGMA foreign_keys = OFF');

  try {
    await dbRun(`
      CREATE TABLE IF NOT EXISTS sponsored_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER NOT NULL,
        full_name TEXT NOT NULL,
        id_number TEXT NOT NULL,
        phone TEXT,
        sponsorship_start_date TEXT NOT NULL,
        annual_amount REAL NOT NULL,
        status TEXT DEFAULT 'active',
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(tenant_id, id_number)
      )
    `);

    await dbRun(`
      INSERT INTO sponsored_new (
        id, tenant_id, full_name, id_number, phone, sponsorship_start_date,
        annual_amount, status, notes, created_at, updated_at
      )
      SELECT
        id, tenant_id, full_name, id_number, phone, sponsorship_start_date,
        annual_amount, COALESCE(status, 'active'), notes, created_at, updated_at
      FROM sponsored
    `);

    await dbRun('DROP TABLE sponsored');
    await dbRun('ALTER TABLE sponsored_new RENAME TO sponsored');
  } finally {
    await dbRun('PRAGMA foreign_keys = ON');
  }
};

const initDB = () => new Promise((resolve, reject) => {
  db = new sqlite3.Database(dbPath, async (err) => {
    if (err) return reject(err);
    
    try {
      // تفعيل WAL لضمان سلامة البيانات والأداء
      await dbRun('PRAGMA journal_mode = WAL');

      // إنشاء الجداول
      await dbRun(`
        CREATE TABLE IF NOT EXISTS admins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT DEFAULT 'admin',
          tenant_id INTEGER,
          password_changed_at TEXT,
          failed_login_attempts INTEGER DEFAULT 0,
          locked_until TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `);

      await dbRun(`
        CREATE TABLE IF NOT EXISTS sponsored (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER NOT NULL,
          full_name TEXT NOT NULL,
          id_number TEXT NOT NULL,
          phone TEXT,
          sponsorship_start_date TEXT NOT NULL,
          annual_amount REAL NOT NULL,
          status TEXT DEFAULT 'active',
          notes TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          UNIQUE(tenant_id, id_number)
        )
      `);

      await dbRun(`
        CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER NOT NULL,
          sponsored_id INTEGER NOT NULL,
          amount REAL NOT NULL,
          payment_date TEXT NOT NULL,
          year INTEGER NOT NULL,
          notes TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (sponsored_id) REFERENCES sponsored(id) ON DELETE CASCADE
        )
      `);

      await dbRun(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER UNIQUE NOT NULL,
          currency TEXT DEFAULT 'SAR',
          currency_symbol TEXT DEFAULT 'ريال',
          currency_position TEXT DEFAULT 'after',
          date_format TEXT DEFAULT 'ar-SA',
          renewal_reminder_days INTEGER DEFAULT 30,
          enable_email_notifications INTEGER DEFAULT 0,
          enable_sms_notifications INTEGER DEFAULT 0,
          enable_2fa INTEGER DEFAULT 1,
          organization_name TEXT DEFAULT 'نظام إدارة المكفولين',
          language TEXT DEFAULT 'ar',
          email_service TEXT DEFAULT 'gmail',
          email_user TEXT,
          email_pass TEXT,
          updated_at TEXT DEFAULT (datetime('now'))
        )
      `);

      await dbRun(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER,
          admin_id INTEGER,
          admin_name TEXT,
          action TEXT NOT NULL,
          entity_type TEXT,
          entity_id INTEGER,
          entity_name TEXT,
          details TEXT,
          ip_address TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `);

      await dbRun(`
        CREATE TABLE IF NOT EXISTS backups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER,
          filename TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          type TEXT DEFAULT 'manual',
          created_at TEXT DEFAULT (datetime('now'))
        )
      `);

      await dbRun(`
        CREATE TABLE IF NOT EXISTS documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER NOT NULL,
          sponsored_id INTEGER NOT NULL,
          filename TEXT NOT NULL,
          original_name TEXT NOT NULL,
          file_type TEXT,
          file_size INTEGER,
          category TEXT DEFAULT 'other',
          description TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (sponsored_id) REFERENCES sponsored(id) ON DELETE CASCADE
        )
      `);

      await dbRun(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER,
          admin_id INTEGER,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          entity_type TEXT,
          entity_id INTEGER,
          is_read INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `);

      // ======================================================
      // Migrations: إضافة الأعمدة الناقصة قبل إنشاء أي indexes
      // ======================================================

      // إضافة أعمدة الأمان للمدراء إذا لم تكن موجودة
      await addColumnIfMissing('admins', 'failed_login_attempts', 'INTEGER DEFAULT 0');
      await addColumnIfMissing('admins', 'locked_until', 'TEXT');
      await addColumnIfMissing('admins', 'role', "TEXT DEFAULT 'admin'");
      await addColumnIfMissing('admins', 'tenant_id', 'INTEGER');

      // إضافة tenant_id للجداول القديمة إذا لم تكن موجودة
      await addColumnIfMissing('sponsored', 'tenant_id', 'INTEGER');
      await addColumnIfMissing('payments', 'tenant_id', 'INTEGER');
      await addColumnIfMissing('documents', 'tenant_id', 'INTEGER');
      await addColumnIfMissing('activity_logs', 'tenant_id', 'INTEGER');
      await addColumnIfMissing('notifications', 'tenant_id', 'INTEGER');

      // migration لجدول backups
      await addColumnIfMissing('backups', 'tenant_id', 'INTEGER');

      // migration لجدول settings
      await addColumnIfMissing('settings', 'tenant_id', 'INTEGER');

      await repairTenantData();
      await dedupeSettings();
      await rebuildSponsoredTableIfNeeded();

      // ======================================================
      // إنشاء الـ indexes بعد التأكد من وجود جميع الأعمدة
      // ======================================================
      await dbRun(`CREATE INDEX IF NOT EXISTS idx_notifications_admin ON notifications(admin_id, is_read)`);
      await dbRun(`CREATE INDEX IF NOT EXISTS idx_activity_logs_admin ON activity_logs(admin_id)`);
      await dbRun(`CREATE INDEX IF NOT EXISTS idx_sponsored_id_number ON sponsored(id_number)`);
      await dbRun(`CREATE UNIQUE INDEX IF NOT EXISTS idx_sponsored_tenant_id_number ON sponsored(tenant_id, id_number)`);
      await dbRun(`CREATE INDEX IF NOT EXISTS idx_payments_sponsored ON payments(sponsored_id)`);
      await dbRun(`CREATE INDEX IF NOT EXISTS idx_sponsored_tenant ON sponsored(tenant_id)`);
      await dbRun(`CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id)`);
      await dbRun(`CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_tenant_unique ON settings(tenant_id) WHERE tenant_id IS NOT NULL`);

      // إدخال المدير الأول (superadmin) إذا لم يوجد أي مدير
      const adminCount = await dbGet('SELECT COUNT(*) as count FROM admins');
      if (adminCount.count === 0) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = bcrypt.hashSync('Admin@123', 12);
        await dbRun(
          'INSERT INTO admins (email, password, name, role, tenant_id) VALUES (?, ?, ?, ?, ?)',
          ['admin@example.com', hashedPassword, 'مدير النظام', 'superadmin', null]
        );
      } else {
        // ترقية أول مدير موجود إلى superadmin إذا لم يكن كذلك
        const firstAdmin = await dbGet('SELECT id, role FROM admins ORDER BY id ASC LIMIT 1');
        if (firstAdmin && firstAdmin.role !== 'superadmin') {
          await dbRun('UPDATE admins SET role = ?, tenant_id = NULL WHERE id = ?', ['superadmin', firstAdmin.id]);
        }
      }

      console.log('✅ SQLite Database connected successfully (sqlite3)');
      resolve(db);
    } catch (e) {
      reject(e);
    }
  });
});

const saveDB = () => {
  // better-sqlite3 يحفظ تلقائياً على القرص
};

const getDB = () => db;

const closeDB = () => {
  if (db) {
    db.close();
    db = null;
  }
};

module.exports = { initDB, getDB, closeDB, saveDB, dbRun, dbGet, dbAll, dbPath, backupsDir };
