const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');

router.use(protect);

// الحصول على سجل النشاطات
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const tenantId = req.tenantId;

    const logs = await ActivityLog.findAll(limit, offset, tenantId);
    const total = await ActivityLog.count(tenantId);

    res.json({
      logs: logs.map(log => ({
        _id: log.id,
        adminId: log.admin_id,
        adminName: log.admin_name,
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        entityName: log.entity_name,
        details: log.details,
        ipAddress: log.ip_address,
        createdAt: log.created_at
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// إحصائيات النشاطات
router.get('/stats', async (req, res) => {
  try {
    const stats = await ActivityLog.getStats(req.tenantId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// سجل نشاطات كيان معين
router.get('/entity/:type/:id', async (req, res) => {
  try {
    const logs = await ActivityLog.findByEntity(req.params.type, req.params.id, req.tenantId);
    res.json(logs.map(log => ({
      _id: log.id,
      adminName: log.admin_name,
      action: log.action,
      details: log.details,
      createdAt: log.created_at
    })));
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

module.exports = router;
