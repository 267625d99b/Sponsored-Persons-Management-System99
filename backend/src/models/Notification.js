const { dbRun, dbGet, dbAll } = require('../config/db');

class Notification {
  static async createTable() {
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
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_notifications_admin ON notifications(admin_id, is_read)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id)`);
  }

  static async create({ adminId, tenantId, type, title, message, entityType, entityId }) {
    const info = await dbRun(
      `INSERT INTO notifications (tenant_id, admin_id, type, title, message, entity_type, entity_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenantId || null, adminId, type, title, message, entityType, entityId]
    );
    return info.lastID;
  }

  static async createForAll({ type, title, message, entityType, entityId, tenantId }) {
    let admins;
    if (tenantId) {
      admins = await dbAll('SELECT id FROM admins WHERE tenant_id = ?', [tenantId]);
    } else {
      admins = await dbAll('SELECT id FROM admins');
    }
    for (const { id: adminId } of admins) {
      await this.create({ adminId, tenantId, type, title, message, entityType, entityId });
    }
  }

  static async getByAdmin(adminId, { limit = 50, unreadOnly = false } = {}) {
    const query = `
      SELECT * FROM notifications 
      WHERE admin_id = ? ${unreadOnly ? 'AND is_read = 0' : ''}
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    const rows = await dbAll(query, [adminId, limit]);
    return rows.map(row => ({
      _id: row.id,
      adminId: row.admin_id,
      tenantId: row.tenant_id,
      type: row.type,
      title: row.title,
      message: row.message,
      entityType: row.entity_type,
      entityId: row.entity_id,
      isRead: !!row.is_read,
      createdAt: row.created_at
    }));
  }

  static async getUnreadCount(adminId) {
    const result = await dbGet(
      'SELECT COUNT(*) as count FROM notifications WHERE admin_id = ? AND is_read = 0',
      [adminId]
    );
    return result?.count || 0;
  }

  static markAsRead(id, adminId) {
    return dbRun('UPDATE notifications SET is_read = 1 WHERE id = ? AND admin_id = ?', [id, adminId]);
  }

  static markAllAsRead(adminId) {
    return dbRun('UPDATE notifications SET is_read = 1 WHERE admin_id = ?', [adminId]);
  }

  static delete(id, adminId) {
    return dbRun('DELETE FROM notifications WHERE id = ? AND admin_id = ?', [id, adminId]);
  }

  static deleteOld(days = 30) {
    return dbRun(
      `DELETE FROM notifications WHERE created_at < datetime('now', '-' || ? || ' days')`,
      [days]
    );
  }
}

module.exports = Notification;
