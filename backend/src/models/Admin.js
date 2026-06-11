const { getDB, dbRun, dbGet, dbAll } = require('../config/db');
const bcrypt = require('bcryptjs');

const Admin = {
    findOne: () => dbGet('SELECT * FROM admins LIMIT 1'),

    // جميع المدراء (للـ superadmin فقط)
    findAll: () => dbAll('SELECT id, email, name, role, tenant_id, created_at FROM admins ORDER BY created_at DESC'),

    // مدراء مستأجر معين
    findByTenant: (tenantId) => dbAll(
      'SELECT id, email, name, role, tenant_id, created_at FROM admins WHERE tenant_id = ? ORDER BY created_at DESC',
      [tenantId]
    ),

    findByEmail: (email) => dbGet('SELECT * FROM admins WHERE email = ?', [email]),

    findById: (id) => dbGet(
      'SELECT id, email, name, role, tenant_id, failed_login_attempts, locked_until, created_at FROM admins WHERE id = ?',
      [id]
    ),

    update: (id, data) => {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map(key => `${key} = ?`).join(', ');
        return dbRun(`UPDATE admins SET ${setClause} WHERE id = ?`, [...values, id]);
    },

    incrementFailedAttempts: (id) => dbRun('UPDATE admins SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?', [id]),

    lockAccount: (id, durationMinutes = 15) => {
        const lockUntil = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
        return dbRun('UPDATE admins SET locked_until = ? WHERE id = ?', [lockUntil, id]);
    },

    findByIdWithPassword: (id) => dbGet(
      'SELECT id, email, password, name, role, tenant_id, failed_login_attempts, locked_until, created_at FROM admins WHERE id = ?',
      [id]
    ),

    // إنشاء مدير عادي مرتبط بـ tenant
    create: async (data) => {
        const hashedPassword = await bcrypt.hash(data.password, 12);
        const info = await dbRun(
          'INSERT INTO admins (email, password, name, role, tenant_id) VALUES (?, ?, ?, ?, ?)',
          [data.email, hashedPassword, data.name, data.role || 'admin', data.tenantId || null]
        );
        return { id: info.lastID, email: data.email, name: data.name, role: data.role || 'admin', tenant_id: data.tenantId || null };
    },

    delete: (id) => dbRun('DELETE FROM admins WHERE id = ?', [id]),

    updatePassword: async (id, newPassword) => {
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        return dbRun('UPDATE admins SET password = ?, password_changed_at = datetime(\'now\') WHERE id = ?', [hashedPassword, id]);
    },

    updateName: (id, newName) => dbRun('UPDATE admins SET name = ? WHERE id = ?', [newName, id]),

    updateEmail: (id, newEmail) => dbRun('UPDATE admins SET email = ? WHERE id = ?', [newEmail, id]),

    comparePassword: async (candidatePassword, hashedPassword) => {
        return await bcrypt.compare(candidatePassword, hashedPassword);
    },

    // عدد المدراء في tenant معين
    countByTenant: async (tenantId) => {
        const res = await dbGet('SELECT COUNT(*) as count FROM admins WHERE tenant_id = ?', [tenantId]);
        return res.count;
    }
};

module.exports = Admin;
