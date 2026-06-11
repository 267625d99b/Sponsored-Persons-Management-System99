const { dbRun, dbGet, dbAll } = require('../config/db');

const Document = {
  findBySponsored: (sponsoredId, tenantId) => {
    return dbAll(
      'SELECT * FROM documents WHERE sponsored_id = ? AND tenant_id = ? ORDER BY created_at DESC',
      [sponsoredId, tenantId]
    );
  },

  findById: (id, tenantId) => {
    if (tenantId !== undefined) {
      return dbGet('SELECT * FROM documents WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    }
    return dbGet('SELECT * FROM documents WHERE id = ?', [id]);
  },

  create: async (data, tenantId) => {
    const info = await dbRun(`
      INSERT INTO documents (tenant_id, sponsored_id, filename, original_name, file_type, file_size, category, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tenantId,
      data.sponsoredId,
      data.filename,
      data.originalName,
      data.fileType,
      data.fileSize,
      data.category || 'other',
      data.description || null
    ]);
    return Document.findById(info.lastID);
  },

  update: (id, data, tenantId) => {
    return dbRun(
      'UPDATE documents SET category = ?, description = ? WHERE id = ? AND tenant_id = ?',
      [data.category, data.description, id, tenantId]
    );
  },

  delete: async (id, tenantId) => {
    const doc = await Document.findById(id);
    await dbRun('DELETE FROM documents WHERE id = ? AND tenant_id = ?', [id, tenantId]);
    return doc;
  },

  countBySponsored: async (sponsoredId, tenantId) => {
    const res = await dbGet(
      'SELECT COUNT(*) as count FROM documents WHERE sponsored_id = ? AND tenant_id = ?',
      [sponsoredId, tenantId]
    );
    return res.count;
  },

  getTotalSize: async (tenantId) => {
    const res = await dbGet(
      'SELECT COALESCE(SUM(file_size), 0) as total FROM documents WHERE tenant_id = ?',
      [tenantId]
    );
    return res.total;
  }
};

module.exports = Document;
