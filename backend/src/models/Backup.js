const { dbRun, dbGet, dbAll, dbPath, backupsDir } = require('../config/db');
const fs = require('fs');
const path = require('path');

const Backup = {
  create: async (type = 'manual', tenantId = null) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tenantSuffix = tenantId ? `_t${tenantId}` : '';
    const filename = `backup${tenantSuffix}_${timestamp}.db`;
    const backupPath = path.join(backupsDir, filename);

    try {
      await dbRun('VACUUM INTO ?', [backupPath]);
    } catch (e) {
      fs.copyFileSync(dbPath, backupPath);
    }

    const fileSize = fs.statSync(backupPath).size;

    const info = await dbRun(
      'INSERT INTO backups (filename, file_size, type, tenant_id) VALUES (?, ?, ?, ?)',
      [filename, fileSize, type, tenantId]
    );

    return Backup.findById(info.lastID);
  },

  findAll: (tenantId = null) => {
    if (tenantId) {
      return dbAll('SELECT * FROM backups WHERE tenant_id = ? ORDER BY created_at DESC', [tenantId]);
    }
    return dbAll('SELECT * FROM backups ORDER BY created_at DESC');
  },

  findById: (id) => dbGet('SELECT * FROM backups WHERE id = ?', [id]),

  delete: async (id, tenantId = null) => {
    const backup = await Backup.findById(id);
    if (!backup) return null;

    // التحقق من الصلاحية
    if (tenantId && backup.tenant_id !== tenantId) return null;

    const backupPath = path.join(backupsDir, backup.filename);
    if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
    await dbRun('DELETE FROM backups WHERE id = ?', [id]);
    return backup;
  },

  restore: async (id) => {
    const backup = await Backup.findById(id);
    if (!backup) return null;

    const backupPath = path.join(backupsDir, backup.filename);
    if (!fs.existsSync(backupPath)) return null;

    const { closeDB, initDB } = require('../config/db');
    closeDB();
    fs.copyFileSync(backupPath, dbPath);
    await initDB();
    return backup;
  },

  getFilePath: (filename) => path.join(backupsDir, filename),

  exportAll: async (tenantId = null) => {
    let sponsored, payments, documents;
    if (tenantId) {
      sponsored = await dbAll('SELECT * FROM sponsored WHERE tenant_id = ?', [tenantId]);
      payments  = await dbAll('SELECT * FROM payments WHERE tenant_id = ?', [tenantId]);
      documents = await dbAll('SELECT * FROM documents WHERE tenant_id = ?', [tenantId]);
    } else {
      sponsored = await dbAll('SELECT * FROM sponsored');
      payments  = await dbAll('SELECT * FROM payments');
      documents = await dbAll('SELECT * FROM documents');
    }
    return { exportDate: new Date().toISOString(), sponsored, payments, documents };
  }
};

module.exports = Backup;
