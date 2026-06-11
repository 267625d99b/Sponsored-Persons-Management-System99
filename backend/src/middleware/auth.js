const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { isTokenBlacklisted } = require('./security');

const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'غير مصرح - يرجى تسجيل الدخول' });
    }

    if (isTokenBlacklisted(token)) {
      return res.status(401).json({ message: 'انتهت صلاحية الجلسة' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({ message: 'انتهت صلاحية الجلسة' });
    }
    
    const admin = await Admin.findById(decoded.id);
    
    if (!admin) {
      return res.status(401).json({ message: 'المستخدم غير موجود' });
    }

    if (admin.password_changed_at) {
      const changedTimestamp = Math.floor(new Date(admin.password_changed_at).getTime() / 1000);
      if (decoded.iat < changedTimestamp) {
        return res.status(401).json({ message: 'تم تغيير كلمة المرور، يرجى تسجيل الدخول مجدداً' });
      }
    }

    req.admin = admin;
    req.token = token;
    // tenant_id يؤخذ من الأدمن
    // السوبر أدمن (tenant_id = null) يستخدم أول tenant في النظام
    if (admin.role === 'superadmin' && !admin.tenant_id) {
      const { dbGet } = require('../config/db');
      const firstAdmin = await dbGet(
        `SELECT tenant_id FROM admins WHERE role != 'superadmin' AND tenant_id IS NOT NULL ORDER BY id ASC LIMIT 1`
      );
      req.tenantId = firstAdmin ? firstAdmin.tenant_id : admin.id;
    } else {
      req.tenantId = admin.tenant_id || admin.id;
    }
    req.isSuperAdmin = admin.role === 'superadmin';
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'انتهت صلاحية الجلسة' });
    }
    res.status(401).json({ message: 'غير مصرح - رمز غير صالح' });
  }
};

// Middleware للتحقق من أن المستخدم superadmin
const requireSuperAdmin = (req, res, next) => {
  if (!req.admin || req.admin.role !== 'superadmin') {
    return res.status(403).json({ message: 'هذا الإجراء متاح للمدير العام فقط' });
  }
  next();
};

// Middleware للتحقق من صلاحيات معينة
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ message: 'غير مصرح' });
    }
    if (roles.length && !roles.includes(req.admin.role || 'admin')) {
      return res.status(403).json({ message: 'ليس لديك صلاحية لهذا الإجراء' });
    }
    next();
  };
};

module.exports = { protect, requireRole, requireSuperAdmin };
