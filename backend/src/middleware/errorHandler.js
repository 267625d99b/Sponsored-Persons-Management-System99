const logger = require('../config/logger');

// أنواع الأخطاء المخصصة
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'المورد غير موجود') {
    super(message, 404);
  }
}

class ValidationError extends AppError {
  constructor(message = 'بيانات غير صالحة') {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'غير مصرح') {
    super(message, 401);
  }
}

// Middleware للتعامل مع الأخطاء
const errorHandler = (err, req, res, next) => {
  // تسجيل الخطأ
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // إذا كان خطأ معروف
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // أخطاء SQLite
  if (err.message?.includes('UNIQUE constraint failed')) {
    return res.status(400).json({
      success: false,
      message: 'هذا السجل موجود مسبقاً'
    });
  }

  if (err.message?.includes('FOREIGN KEY constraint failed')) {
    return res.status(400).json({
      success: false,
      message: 'لا يمكن حذف هذا السجل لوجود بيانات مرتبطة به'
    });
  }

  // خطأ JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'رمز غير صالح'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'انتهت صلاحية الجلسة'
    });
  }

  // خطأ غير معروف
  console.error('❌ Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: 'حدث خطأ في الخادم'
  });
};

// Middleware للمسارات غير الموجودة
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `المسار ${req.originalUrl} غير موجود`
  });
};

// Async wrapper لتجنب try-catch في كل controller
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};
