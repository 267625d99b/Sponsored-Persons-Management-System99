const { dbRun, dbGet, dbAll } = require('../config/db');

const Sponsored = {
  findAll: (tenantId) => dbAll(
    'SELECT * FROM sponsored WHERE tenant_id = ? ORDER BY created_at DESC',
    [tenantId]
  ),

  findById: (id, tenantId) => dbGet(
    'SELECT * FROM sponsored WHERE id = ? AND tenant_id = ?',
    [Number(id), tenantId]
  ),

  findByIdNumber: (idNumber, tenantId) => dbGet(
    'SELECT * FROM sponsored WHERE id_number = ? AND tenant_id = ?',
    [idNumber, tenantId]
  ),

  findActive: (tenantId) => dbAll(
    "SELECT * FROM sponsored WHERE status = 'active' AND tenant_id = ?",
    [tenantId]
  ),

  create: async (data, tenantId) => {
    const info = await dbRun(`
      INSERT INTO sponsored (tenant_id, full_name, id_number, phone, sponsorship_start_date, annual_amount, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tenantId,
      data.fullName,
      data.idNumber,
      data.phone || null,
      data.sponsorshipStartDate,
      data.annualAmount,
      data.status || 'active',
      data.notes || null
    ]);
    return Sponsored.findById(info.lastID, tenantId);
  },

  update: async (id, data, tenantId) => {
    await dbRun(`
      UPDATE sponsored SET 
        full_name = ?, id_number = ?, phone = ?, sponsorship_start_date = ?,
        annual_amount = ?, status = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ? AND tenant_id = ?
    `, [data.fullName, data.idNumber, data.phone || null, data.sponsorshipStartDate,
        data.annualAmount, data.status || 'active', data.notes || null, id, tenantId]);
    return Sponsored.findById(id, tenantId);
  },

  delete: async (id, tenantId) => {
    await dbRun('DELETE FROM payments WHERE sponsored_id = ? AND tenant_id = ?', [id, tenantId]);
    await dbRun('DELETE FROM sponsored WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    return { changes: 1 };
  },

  count: async (tenantId) => {
    const res = await dbGet('SELECT COUNT(*) as count FROM sponsored WHERE tenant_id = ?', [tenantId]);
    return res.count;
  },

  countActive: async (tenantId) => {
    const res = await dbGet(
      "SELECT COUNT(*) as count FROM sponsored WHERE status = 'active' AND tenant_id = ?",
      [tenantId]
    );
    return res.count;
  }
};

module.exports = Sponsored;
