const express = require('express');
const router = express.Router();
const Backup = require('../models/Backup');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');
const { dbPath } = require('../config/db');
const fs = require('fs');
const path = require('path');

router.use(protect);

// الحصول على قائمة النسخ الاحتياطية
router.get('/', async (req, res) => {
  try {
    const backups = await Backup.findAll(req.tenantId);
    res.json(backups.map(b => ({
      _id: b.id,
      filename: b.filename,
      fileSize: b.file_size,
      type: b.type,
      createdAt: b.created_at
    })));
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// إنشاء نسخة احتياطية
router.post('/create', async (req, res) => {
  try {
    const backup = await Backup.create('manual', req.tenantId);

    await ActivityLog.create({
      tenantId: req.tenantId,
      adminId: req.admin.id,
      adminName: req.admin.name,
      action: 'إنشاء نسخة احتياطية',
      entityType: 'backup',
      entityId: backup.id,
      entityName: backup.filename
    });

    res.status(201).json({
      _id: backup.id,
      filename: backup.filename,
      fileSize: backup.file_size,
      type: backup.type,
      createdAt: backup.created_at,
      message: 'تم إنشاء النسخة الاحتياطية بنجاح'
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// تحميل نسخة احتياطية
router.get('/download/:id', async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id);
    if (!backup) {
      return res.status(404).json({ message: 'النسخة غير موجودة' });
    }
    
    const filePath = Backup.getFilePath(backup.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'ملف النسخة غير موجود' });
    }
    
    res.download(filePath, backup.filename);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// استعادة نسخة احتياطية
router.post('/restore/:id', async (req, res) => {
  try {
    const backup = await Backup.restore(req.params.id);
    if (!backup) {
      return res.status(404).json({ message: 'النسخة غير موجودة' });
    }
    
    res.json({ message: 'تم استعادة النسخة الاحتياطية بنجاح. يرجى إعادة تشغيل الخادم.' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// حذف نسخة احتياطية
router.delete('/:id', async (req, res) => {
  try {
    const backup = await Backup.delete(req.params.id, req.tenantId);
    if (!backup) return res.status(404).json({ message: 'النسخة غير موجودة' });

    await ActivityLog.create({
      tenantId: req.tenantId,
      adminId: req.admin.id,
      adminName: req.admin.name,
      action: 'حذف نسخة احتياطية',
      entityType: 'backup',
      entityId: backup.id,
      entityName: backup.filename
    });

    res.json({ message: 'تم حذف النسخة الاحتياطية' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// تصدير كل البيانات JSON
router.get('/export', async (req, res) => {
  try {
    const data = await Backup.exportAll(req.tenantId);

    await ActivityLog.create({
      tenantId: req.tenantId,
      adminId: req.admin.id,
      adminName: req.admin.name,
      action: 'تصدير البيانات',
      entityType: 'export',
      details: { format: 'json' }
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=export_${new Date().toISOString().split('T')[0]}.json`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

module.exports = router;
