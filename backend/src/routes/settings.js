const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Settings = require('../models/Settings');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');
const { passwordLimiter } = require('../middleware/security');
const { testEmailConfig, sendCustomEmail, isEmailConfigured } = require('../config/email');

router.use(protect);

// تحديث اسم المستخدم
router.post('/update-name', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'يرجى إدخال اسم صحيح' });
    }
    
    await Admin.updateName(req.admin.id, name.trim());
    
    await ActivityLog.create({
      adminId: req.admin.id,
      adminName: name.trim(),
      action: 'تحديث اسم المستخدم',
      entityType: 'admin',
      entityId: req.admin.id
    });
    
    res.json({ message: 'تم تحديث الاسم بنجاح', name: name.trim() });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// تحديث البريد الإلكتروني
router.post('/update-email', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'يرجى إدخال بريد إلكتروني صحيح' });
    }
    
    if (!password) {
      return res.status(400).json({ message: 'يرجى إدخال كلمة المرور للتأكيد' });
    }
    
    // التحقق من كلمة المرور
    const admin = await Admin.findByIdWithPassword(req.admin.id);
    if (!admin) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    
    const isMatch = await Admin.comparePassword(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'كلمة المرور غير صحيحة' });
    }
    
    // التحقق من عدم وجود البريد مسبقاً
    const existingAdmin = await Admin.findByEmail(email);
    if (existingAdmin && existingAdmin.id !== req.admin.id) {
      return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    }
    
    await Admin.updateEmail(req.admin.id, email.trim());
    
    await ActivityLog.create({
      adminId: req.admin.id,
      adminName: req.admin.name,
      action: 'تحديث البريد الإلكتروني',
      entityType: 'admin',
      entityId: req.admin.id,
      details: { newEmail: email }
    });
    
    res.json({ message: 'تم تحديث البريد الإلكتروني بنجاح', email: email.trim() });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// تغيير كلمة المرور - مع rate limiting
router.post('/change-password', passwordLimiter, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'يرجى إدخال كلمة المرور الحالية والجديدة' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
    }
    
    const admin = await Admin.findByIdWithPassword(req.admin.id);
    if (!admin) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    
    const isMatch = await Admin.comparePassword(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'كلمة المرور الحالية غير صحيحة' });
    }
    
    await Admin.updatePassword(req.admin.id, newPassword);
    
    await ActivityLog.create({
      adminId: req.admin.id,
      adminName: req.admin.name,
      action: 'تغيير كلمة المرور',
      entityType: 'admin',
      entityId: req.admin.id
    });
    
    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// الحصول على الإعدادات
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(403).json({ message: 'لا يوجد tenant محدد' });
    const settings = await Settings.get(tenantId);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// تحديث الإعدادات
router.put('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(403).json({ message: 'لا يوجد tenant محدد' });
    const settings = await Settings.update(req.body, tenantId);

    await ActivityLog.create({
      tenantId,
      adminId: req.admin.id,
      adminName: req.admin.name,
      action: 'تحديث الإعدادات',
      entityType: 'settings',
      details: req.body
    });

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// التحقق من حالة إعدادات البريد
router.get('/email-status', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    let emailUser = null;
    let service = 'gmail';
    let configured = false;

    try {
      const settings = await Settings.getEmailConfig(tenantId);
      if (settings && settings.user && settings.pass) {
        configured = true;
        emailUser = settings.user.replace(/(.{2}).*(@.*)/, '$1***$2');
        service = settings.service || 'gmail';
      }
    } catch { }

    res.json({ configured, email: emailUser, service });
  } catch (error) {
    res.status(500).json({ message: 'خطأ', error: error.message });
  }
});

// تحديث إعدادات البريد
router.post('/email-config', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { emailService, emailUser, emailPass } = req.body;

    if (!emailUser || !emailPass) return res.status(400).json({ message: 'يرجى إدخال البريد وكلمة المرور' });
    if (!emailUser.includes('@')) return res.status(400).json({ message: 'بريد إلكتروني غير صحيح' });

    await Settings.updateEmailConfig(emailService || 'gmail', emailUser, emailPass, tenantId);

    await ActivityLog.create({
      tenantId,
      adminId: req.admin.id,
      adminName: req.admin.name,
      action: 'تحديث إعدادات البريد',
      entityType: 'settings',
      details: { emailUser }
    });

    res.json({ message: 'تم حفظ إعدادات البريد بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// اختبار إعدادات البريد
router.post('/test-email', async (req, res) => {
  try {
    const { testEmail } = req.body;
    const result = await testEmailConfig(testEmail || req.admin.email);
    
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ message: result.error });
    }
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

// إرسال بريد مخصص
router.post('/send-email', async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    
    if (!to || !subject || !message) {
      return res.status(400).json({ message: 'يرجى ملء جميع الحقول' });
    }
    
    const result = await sendCustomEmail(to, subject, message);
    
    if (result.success) {
      await ActivityLog.create({
        adminId: req.admin.id,
        adminName: req.admin.name,
        action: 'إرسال بريد إلكتروني',
        entityType: 'email',
        details: { to, subject }
      });
      
      res.json({ message: 'تم إرسال البريد بنجاح' });
    } else {
      res.status(400).json({ message: result.error || 'فشل إرسال البريد' });
    }
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
});

module.exports = router;
