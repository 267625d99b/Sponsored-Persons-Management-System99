const { dbRun, dbGet, dbAll } = require('../config/db');

const ActivityLog = {
  create: (data) => {
    return dbRun(`
      INSERT INTO activity_logs (tenant_id, admin_id, admin_name, action, entity_type, entity_id, entity_name, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.tenantId || null,
      data.adminId || null,
      data.adminName || 'النظام',
      data.action,
      data.entityType,
      data.entityId || null,
      data.entityName || null,
      data.details ? JSON.stringify(data.details) : null,
      data.ipAddress || null
    ]);
  },

  findAll: async (limit = 100, offset = 0, tenantId) => {
    let rows;
    if (tenantId) {
      rows = await dbAll(
        'SELECT * FROM activity_logs WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [tenantId, limit, offset]
      );
    } else {
      rows = await dbAll(
        'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
    }
    return rows.map(log => {
      if (log.details) log.details = JSON.parse(log.details);
      return log;
    });
  },

  findByEntity: async (entityType, entityId, tenantId) => {
    let rows;
    if (tenantId) {
      rows = await dbAll(
        'SELECT * FROM activity_logs WHERE entity_type = ? AND entity_id = ? AND tenant_id = ? ORDER BY created_at DESC',
        [entityType, entityId, tenantId]
      );
    } else {
      rows = await dbAll(
        'SELECT * FROM activity_logs WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC',
        [entityType, entityId]
      );
    }
    return rows.map(log => {
      if (log.details) log.details = JSON.parse(log.details);
      return log;
    });
  },

  count: async (tenantId) => {
    let res;
    if (tenantId) {
      res = await dbGet('SELECT COUNT(*) as count FROM activity_logs WHERE tenant_id = ?', [tenantId]);
    } else {
      res = await dbGet('SELECT COUNT(*) as count FROM activity_logs');
    }
    return res.count;
  },

  getStats: async (tenantId) => {
    const today = new Date().toISOString().split('T')[0];
    let todayRes, totalRes;
    if (tenantId) {
      todayRes = await dbGet(
        'SELECT COUNT(*) as count FROM activity_logs WHERE date(created_at) = ? AND tenant_id = ?',
        [today, tenantId]
      );
      totalRes = await dbGet('SELECT COUNT(*) as count FROM activity_logs WHERE tenant_id = ?', [tenantId]);
    } else {
      todayRes = await dbGet('SELECT COUNT(*) as count FROM activity_logs WHERE date(created_at) = ?', [today]);
      totalRes = await dbGet('SELECT COUNT(*) as count FROM activity_logs');
    }
    return { todayCount: todayRes.count, totalCount: totalRes.count };
  }
};

module.exports = ActivityLog;
