const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');

// الحصول على الإشعارات
router.get('/', protect, async (req, res) => {
  try {
    const { limit = 50, unreadOnly } = req.query;
    const notifications = await Notification.getByAdmin(req.admin.id, {
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true'
    });
    const unreadCount = await Notification.getUnreadCount(req.admin.id);
    
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب الإشعارات', error: error.message });
  }
});

// عدد الإشعارات غير المقروءة
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.admin.id);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'خطأ', error: error.message });
  }
});

// تحديد إشعار كمقروء
router.put('/:id/read', protect, async (req, res) => {
  try {
    await Notification.markAsRead(req.params.id, req.admin.id);
    res.json({ message: 'تم' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ', error: error.message });
  }
});

// تحديد الكل كمقروء
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.markAllAsRead(req.admin.id);
    res.json({ message: 'تم تحديد الكل كمقروء' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ', error: error.message });
  }
});

// تشغيل فحص الإشعارات يدوياً (للاختبار)
router.post('/trigger-check', protect, async (req, res) => {
  try {
    const { checkRenewalsAndOverdue, checkUrgentRenewals } = require('../config/scheduler');
    await checkRenewalsAndOverdue();
    await checkUrgentRenewals();
    const count = await Notification.getUnreadCount(req.admin.id);
    res.json({ message: `✅ تم تشغيل الفحص — ${count} إشعار غير مقروء لديك الآن` });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تشغيل الفحص', error: error.message });
  }
});

// حذف إشعار
router.delete('/:id', protect, async (req, res) => {
  try {
    await Notification.delete(req.params.id, req.admin.id);
    res.json({ message: 'تم الحذف' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ', error: error.message });
  }
});

module.exports = router;
