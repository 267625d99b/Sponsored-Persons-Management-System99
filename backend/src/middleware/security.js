const rateLimit = require('express-rate-limit');
const CryptoJS = require('crypto-js');
const crypto = require('crypto');

// مفتاح التشفير - يجب تخزينه في .env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-min-32-characters!!';

// التحقق من قوة المفاتيح عند بدء التشغيل
const validateSecurityConfig = () => {
  const warnings = [];
  
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    warnings.push('⚠️ JWT_SECRET ضعيف أو غير موجود - يجب أن يكون 32 حرف على الأقل');
  }
  
  if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 32) {
    warnings.push('⚠️ ENCRYPTION_KEY ضعيف أو غير موجود');
  }
  
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'your_super_secret_key_min_32_characters') {
      console.error('🚨 خطر! JWT_SECRET الافتراضي مستخدم في الإنتاج!');
      process.exit(1);
    }
  }
  
  warnings.forEach(w => console.warn(w));
  return warnings.length === 0;
};

// توليد مفتاح آمن
const generateSecureKey = (length = 64) => {
  return crypto.randomBytes(length).toString('hex');
};

// Rate Limiter للـ API العام
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // زيادة الحد إلى 1000 طلب
  message: { message: 'طلبات كثيرة جداً، حاول مرة أخرى بعد 15 دقيقة' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health', // تجاوز health check
});

// Rate Limiter مشدد لتسجيل الدخول
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: process.env.NODE_ENV === 'production' ? 10 : 100, // في التطوير 100 محاولة، في الإنتاج 10 فقط
  message: { message: 'محاولات دخول كثيرة، حاول مرة أخرى بعد 15 دقيقة' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Rate Limiter لتغيير كلمة المرور
const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة
  max: 3, // 3 محاولات فقط
  message: { message: 'محاولات كثيرة لتغيير كلمة المرور، حاول بعد ساعة' },
  standardHeaders: true,
  legacyHeaders: false,
});

// تشفير البيانات الحساسة
const encrypt = (text) => {
  if (!text) return text;
  return CryptoJS.AES.encrypt(text.toString(), ENCRYPTION_KEY).toString();
};

// فك تشفير البيانات
const decrypt = (ciphertext) => {
  if (!ciphertext) return ciphertext;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return ciphertext; // إرجاع النص الأصلي إذا فشل فك التشفير
  }
};

// تشفير رقم الهاتف
const encryptPhone = (phone) => encrypt(phone);
const decryptPhone = (encryptedPhone) => decrypt(encryptedPhone);

// Security Headers Middleware
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // CSP مرن يسمح بتحميل الصور والملفات من نفس المصدر والـ localhost
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: blob: http://localhost:5000 http://127.0.0.1:5000; media-src 'self' http://localhost:5000; connect-src 'self' http://localhost:5000 http://127.0.0.1:5000"
  );
  next();
};

// التحقق من قوة كلمة المرور
const validatePasswordStrength = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('يجب أن تكون 8 أحرف على الأقل');
  if (!/[A-Z]/.test(password)) errors.push('يجب أن تحتوي على حرف كبير');
  if (!/[a-z]/.test(password)) errors.push('يجب أن تحتوي على حرف صغير');
  if (!/[0-9]/.test(password)) errors.push('يجب أن تحتوي على رقم');
  
  // كلمات مرور شائعة ممنوعة
  const commonPasswords = ['password', '12345678', 'admin123', 'qwerty123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('كلمة المرور شائعة جداً');
  }
  
  return { valid: errors.length === 0, errors };
};

// التحقق من صحة المدخلات - تركيز على XSS فقط
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    // إزالة scripts
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // إزالة event handlers
    .replace(/on\w+\s*=/gi, '')
    // إزالة javascript: URLs
    .replace(/javascript:/gi, '')
    // إزالة data: URLs خطرة
    .replace(/data:\s*text\/html/gi, '')
    // تنظيف HTML entities خطرة
    .replace(/&lt;script/gi, '')
    .trim();
};

const sanitizeMiddleware = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string') {
        obj[key] = sanitizeInput(obj[key]);
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    });
    return obj;
  };
  
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  
  next();
};

// CSRF Token generation
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Token blacklist للـ logout
const tokenBlacklist = new Set();
const TOKEN_BLACKLIST_CLEANUP_INTERVAL = 60 * 60 * 1000; // ساعة

const blacklistToken = (token) => {
  tokenBlacklist.add(token);
};

const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

// تنظيف دوري للـ blacklist
setInterval(() => {
  tokenBlacklist.clear();
}, TOKEN_BLACKLIST_CLEANUP_INTERVAL);

module.exports = {
  apiLimiter,
  loginLimiter,
  passwordLimiter,
  encrypt,
  decrypt,
  encryptPhone,
  decryptPhone,
  securityHeaders,
  sanitizeMiddleware,
  validatePasswordStrength,
  validateSecurityConfig,
  generateSecureKey,
  generateCSRFToken,
  blacklistToken,
  isTokenBlacklisted
};
