const { dbRun, dbGet, dbAll } = require('../config/db');

const Payment = {
  findBySponsored: (sponsoredId, tenantId) => {
    return dbAll(
      'SELECT * FROM payments WHERE sponsored_id = ? AND tenant_id = ? ORDER BY payment_date DESC',
      [parseInt(sponsoredId), tenantId]
    );
  },

  findById: (id, tenantId) => {
    if (tenantId !== undefined) {
      return dbGet('SELECT * FROM payments WHERE id = ? AND tenant_id = ?', [parseInt(id), tenantId]);
    }
    return dbGet('SELECT * FROM payments WHERE id = ?', [parseInt(id)]);
  },

  findBySponsoredAndYear: (sponsoredId, year, tenantId) => {
    return dbAll(
      'SELECT * FROM payments WHERE sponsored_id = ? AND year = ? AND tenant_id = ?',
      [parseInt(sponsoredId), parseInt(year), tenantId]
    );
  },

  getTotalByYear: async (year, tenantId) => {
    const result = await dbGet(
      'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE year = ? AND tenant_id = ?',
      [parseInt(year), tenantId]
    );
    return result?.total || 0;
  },

  getTotalBySponsoredAndYear: async (sponsoredId, year, tenantId) => {
    const result = await dbGet(
      'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE sponsored_id = ? AND year = ? AND tenant_id = ?',
      [parseInt(sponsoredId), parseInt(year), tenantId]
    );
    return result?.total || 0;
  },

  create: async (data, tenantId) => {
    const date = new Date(data.paymentDate);
    const year = data.year || date.getFullYear();

    const info = await dbRun(`
      INSERT INTO payments (tenant_id, sponsored_id, amount, payment_date, year, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [tenantId, parseInt(data.sponsored), data.amount, data.paymentDate, year, data.notes || null]);

    return Payment.findById(info.lastID);
  },

  delete: (id, tenantId) => {
    return dbRun('DELETE FROM payments WHERE id = ? AND tenant_id = ?', [id, tenantId]);
  },

  countByYear: async (year, tenantId) => {
    const result = await dbGet(
      'SELECT COUNT(*) as count FROM payments WHERE year = ? AND tenant_id = ?',
      [parseInt(year), tenantId]
    );
    return result?.count || 0;
  }
};

module.exports = Payment;
