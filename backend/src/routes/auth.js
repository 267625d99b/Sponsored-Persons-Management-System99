const express = require('express');
const router = express.Router();
const { 
  login, 
  getMe, 
  createAdmin, 
  verifyCode, 
  resendCode,
  getAllAdmins,
  deleteAdmin,
  updateAdmin,
  changePassword,
  getAdminEmailConfig,
  updateAdminEmailConfig,
  testAdminEmailConfig
} = require('../controllers/authController');
const { protect, requireSuperAdmin } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/security');

router.post('/login', loginLimiter, login);
router.post('/verify-code', loginLimiter, verifyCode);
router.post('/resend-code', loginLimiter, resendCode);
router.get('/me', protect, getMe);

// إنشاء مستخدم جديد — للـ superadmin فقط
router.post('/create-admin', protect, requireSuperAdmin, createAdmin);

// إدارة المستخدمين
router.get('/admins', protect, requireSuperAdmin, getAllAdmins);
router.delete('/admins/:id', protect, requireSuperAdmin, deleteAdmin);
router.put('/admins/:id', protect, requireSuperAdmin, updateAdmin);

// إعدادات Gmail لكل مستخدم (superadmin فقط)
router.get('/admins/:id/email-config', protect, requireSuperAdmin, getAdminEmailConfig);
router.put('/admins/:id/email-config', protect, requireSuperAdmin, updateAdminEmailConfig);
router.post('/admins/:id/test-email', protect, requireSuperAdmin, testAdminEmailConfig);

router.post('/change-password', protect, changePassword);

module.exports = router;
