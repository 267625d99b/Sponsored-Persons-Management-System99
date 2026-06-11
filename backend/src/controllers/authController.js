const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const ActivityLog = require('../models/ActivityLog');
const Settings = require('../models/Settings');
const { sendVerificationCode, generateVerificationCode, isEmailConfigured, testEmailConfig } = require('../config/email');

// تخزين مؤقت لرموز التحقق
const verificationCodes = new Map();

const generateToken = (admin) => {
  return jwt.sign(
    { id: admin.id, role: admin.role, tenantId: admin.tenant_id || null },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// تسجيل الدخول
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'يرجى إدخال البريد وكلمة المرور' });
    }

    const admin = await Admin.findByEmail(email);
    if (!admin) {
      return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
    }

    const isPasswordCorrect = await Admin.comparePassword(password, admin.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
    }

    // tenantId لهذا المستخدم (null للـ superadmin)
    const tenantId = admin.tenant_id || null;

    // التحقق من إعدادات 2FA للمستخدم
    const settings = await Settings.get(tenantId || admin.id);
    const emailConfigured = await isEmailConfigured(tenantId);

    // إذا كان 2FA مفعّلاً وإعدادات الإيميل موجودة → أرسل رمز
    if (settings.enable2FA && emailConfigured) {
      const code = generateVerificationCode();
      verificationCodes.set(email, {
        code,
        adminId: admin.id,
        adminName: admin.name,
        expiresAt: Date.now() + 5 * 60 * 1000
      });

      const emailResult = await sendVerificationCode(email, code, admin.name, tenantId);
      if (!emailResult.success) {
        // فشل إرسال الإيميل → تسجيل دخول مباشر
        console.warn('2FA email failed, falling back to direct login:', emailResult.error);
      } else {
        return res.json({ requiresVerification: true, email: admin.email });
      }
    }

    // تسجيل دخول مباشر (بدون 2FA أو فشل الإيميل)
    const token = generateToken(admin);
    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        tenantId: admin.tenant_id
      }
    });
  } catch (error) {
    console.error('CRITICAL LOGIN ERROR:', error);
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// التحقق من الرمز (2FA)
exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'يرجى إدخال البريد ورمز التحقق' });
    }

    const storedData = verificationCodes.get(email);
    if (!storedData) {
      return res.status(400).json({ message: 'لم يتم طلب رمز تحقق لهذا البريد' });
    }
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ message: 'انتهت صلاحية رمز التحقق' });
    }
    if (storedData.code !== code) {
      return res.status(400).json({ message: 'رمز التحقق غير صحيح' });
    }

    verificationCodes.delete(email);

    const admin = await Admin.findById(storedData.adminId);
    const token = generateToken(admin);

    await ActivityLog.create({
      tenantId: admin.tenant_id,
      adminId: admin.id,
      adminName: admin.name,
      action: 'تسجيل دخول (2FA)',
      entityType: 'auth',
      entityId: admin.id,
      entityName: admin.name,
      ipAddress: req.ip
    });

    res.json({
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role, tenantId: admin.tenant_id },
      message: 'تم التحقق بنجاح'
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// إعادة إرسال الرمز
exports.resendCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'يرجى إدخال البريد' });

    const admin = await Admin.findByEmail(email);
    if (!admin) return res.status(400).json({ message: 'البريد غير مسجل' });

    const tenantId = admin.tenant_id || null;
    const code = generateVerificationCode();
    verificationCodes.set(email, {
      code, adminId: admin.id, adminName: admin.name,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    const emailResult = await sendVerificationCode(email, code, admin.name, tenantId);
    if (!emailResult.success) {
      return res.status(500).json({ message: 'فشل إرسال البريد' });
    }

    res.json({ message: 'تم إرسال رمز جديد' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// معلومات المستخدم الحالي
exports.getMe = async (req, res) => {
  res.json({
    admin: {
      id: req.admin.id,
      email: req.admin.email,
      name: req.admin.name,
      role: req.admin.role,
      tenantId: req.admin.tenant_id
    }
  });
};

// إنشاء مستخدم جديد (للـ superadmin فقط)
exports.createAdmin = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
    }

    const existingAdmin = await Admin.findByEmail(email);
    if (existingAdmin) {
      return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
    }

    // المستخدم الجديد يحصل على tenant_id = id الخاص به (يُعين بعد الإنشاء)
    const newAdmin = await Admin.create({
      email, password, name,
      role: 'admin',
      tenantId: null // سيُحدَّث بعد معرفة الـ id
    });

    // tenant_id = id الخاص به (كل مستخدم = tenant منفصل)
    const { dbRun } = require('../config/db');
    await dbRun('UPDATE admins SET tenant_id = ? WHERE id = ?', [newAdmin.id, newAdmin.id]);

    // إنشاء إعدادات افتراضية للـ tenant الجديد
    await Settings.initForTenant(newAdmin.id);

    await ActivityLog.create({
      tenantId: null, // سجل على مستوى النظام
      adminId: req.admin?.id || null,
      adminName: req.admin?.name || 'النظام',
      action: 'إنشاء مستخدم جديد',
      entityType: 'admin',
      entityId: newAdmin.id,
      entityName: newAdmin.name,
      details: { email: newAdmin.email },
      ipAddress: req.ip
    });

    res.status(201).json({
      message: 'تم إنشاء المستخدم بنجاح',
      admin: { id: newAdmin.id, email: newAdmin.email, name: newAdmin.name, role: newAdmin.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// قائمة المستخدمين (للـ superadmin: كل المستخدمين، لغيره: مستخدمو نفس tenant)
exports.getAllAdmins = async (req, res) => {
  try {
    let admins;
    if (req.admin.role === 'superadmin') {
      // يجلب فقط المدراء العاديين (ليس الـ superadmin)
      const { dbAll } = require('../config/db');
      admins = await dbAll(
        "SELECT id, email, name, role, tenant_id, created_at FROM admins WHERE role != 'superadmin' ORDER BY created_at DESC"
      );
    } else {
      admins = await Admin.findByTenant(req.tenantId);
    }
    res.json({ admins });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// حذف مستخدم
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.admin.id) {
      return res.status(400).json({ message: 'لا يمكنك حذف حسابك الخاص' });
    }

    // السوبر أدمن لا يُحذف
    const targetAdmin = await Admin.findById(id);
    if (!targetAdmin) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    if (targetAdmin.role === 'superadmin') {
      return res.status(403).json({ message: 'لا يمكن حذف المدير العام' });
    }

    // التحقق من الصلاحية: السوبر أدمن يحذف أي مستخدم، غيره لا يحذف
    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({ message: 'ليس لديك صلاحية حذف المستخدمين' });
    }

    await Admin.delete(id);

    await ActivityLog.create({
      tenantId: null,
      adminId: req.admin.id,
      adminName: req.admin.name,
      action: 'حذف مستخدم',
      entityType: 'admin',
      entityId: parseInt(id),
      entityName: targetAdmin.name,
      ipAddress: req.ip
    });

    res.json({ message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// تحديث بيانات مستخدم
exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, newPassword } = req.body;

    // السوبر أدمن فقط يعدّل المستخدمين
    if (req.admin.role !== 'superadmin') {
      return res.status(403).json({ message: 'ليس لديك صلاحية تعديل المستخدمين' });
    }

    const targetAdmin = await Admin.findById(id);
    if (!targetAdmin) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    if (email && email !== targetAdmin.email) {
      const existing = await Admin.findByEmail(email);
      if (existing) {
        return res.status(400).json({ message: 'البريد الإلكتروني مستخدم بالفعل' });
      }
      await Admin.updateEmail(id, email);
    }

    if (name) await Admin.updateName(id, name);

    // تغيير كلمة المرور إذا أُرسلت
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
      }
      await Admin.updatePassword(id, newPassword);
    }

    await ActivityLog.create({
      tenantId: null,
      adminId: req.admin.id,
      adminName: req.admin.name,
      action: newPassword ? 'تعديل مستخدم وتغيير كلمة المرور' : 'تعديل مستخدم',
      entityType: 'admin',
      entityId: parseInt(id),
      entityName: targetAdmin.name,
      ipAddress: req.ip
    });

    res.json({ message: 'تم التحديث بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// تغيير كلمة المرور
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findByIdWithPassword(req.admin.id);
    const isMatch = await Admin.comparePassword(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'كلمة المرور الحالية غير صحيحة' });
    }

    await Admin.updatePassword(req.admin.id, newPassword);

    await ActivityLog.create({
      tenantId: req.tenantId,
      adminId: req.admin.id,
      adminName: req.admin.name,
      action: 'تغيير كلمة المرور',
      entityType: 'admin',
      entityId: req.admin.id,
      entityName: req.admin.name,
      ipAddress: req.ip
    });

    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// جلب إعدادات Gmail لمستخدم معين (superadmin فقط)
exports.getAdminEmailConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const targetAdmin = await Admin.findById(id);
    if (!targetAdmin) return res.status(404).json({ message: 'المستخدم غير موجود' });

    const tenantId = targetAdmin.tenant_id;
    const settings = await Settings.get(tenantId);

    res.json({
      emailUser: settings.emailUser || '',
      emailConfigured: settings.emailConfigured || false,
      emailService: settings.emailService || 'gmail'
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// تحديث إعدادات Gmail لمستخدم معين (superadmin فقط)
exports.updateAdminEmailConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { emailUser, emailPass, emailService } = req.body;

    const targetAdmin = await Admin.findById(id);
    if (!targetAdmin) return res.status(404).json({ message: 'المستخدم غير موجود' });
    if (targetAdmin.role === 'superadmin') return res.status(403).json({ message: 'لا يمكن تعديل إعدادات المدير العام من هنا' });

    const tenantId = targetAdmin.tenant_id;
    if (!tenantId) return res.status(400).json({ message: 'هذا المستخدم لا يملك tenant محدد' });

    await Settings.updateEmailConfig(emailService || 'gmail', emailUser || null, emailPass || null, tenantId);

    // تفعيل إشعارات البريد تلقائياً عند إضافة إعدادات Gmail
    if (emailUser && emailPass) {
      const { dbRun } = require('../config/db');
      await dbRun(
        'UPDATE settings SET enable_email_notifications = 1 WHERE tenant_id = ?',
        [tenantId]
      );
    }

    await ActivityLog.create({
      tenantId: null,
      adminId: req.admin.id,
      adminName: req.admin.name,
      action: 'تحديث إعدادات Gmail لمستخدم',
      entityType: 'admin',
      entityId: parseInt(id),
      entityName: targetAdmin.name,
      ipAddress: req.ip
    });

    res.json({ message: 'تم حفظ إعدادات البريد بنجاح وتفعيل إشعارات البريد' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};

// اختبار إعدادات Gmail لمستخدم معين (superadmin فقط)
exports.testAdminEmailConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const targetAdmin = await Admin.findById(id);
    if (!targetAdmin) return res.status(404).json({ message: 'المستخدم غير موجود' });

    const tenantId = targetAdmin.tenant_id;
    const result = await testEmailConfig(targetAdmin.email, tenantId);

    if (result.success) {
      res.json({ message: `تم إرسال رسالة اختبار إلى ${targetAdmin.email} بنجاح ✅` });
    } else {
      res.status(400).json({ message: `فشل الاتصال: ${result.error}` });
    }
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};
