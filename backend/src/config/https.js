const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * إنشاء سيرفر HTTPS أو HTTP حسب الإعدادات
 * @param {Express} app - تطبيق Express
 * @param {number} port - رقم البورت
 * @param {string} host - العنوان
 * @returns {Server} السيرفر
 */
const createServer = (app, port, host) => {
  const sslKeyPath = process.env.SSL_KEY_PATH;
  const sslCertPath = process.env.SSL_CERT_PATH;

  // التحقق من وجود شهادات SSL
  if (sslKeyPath && sslCertPath && fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    const options = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath)
    };

    console.log('🔒 HTTPS enabled');
    return https.createServer(options, app);
  }

  // إذا لم توجد شهادات، استخدم HTTP
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Warning: Running in production without HTTPS!');
  }
  
  return http.createServer(app);
};

/**
 * إعادة توجيه HTTP إلى HTTPS
 */
const redirectToHttps = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
};

/**
 * إنشاء شهادة SSL ذاتية للتطوير (Self-signed)
 * ملاحظة: للاستخدام في التطوير فقط!
 */
const generateDevCertificate = () => {
  const certsDir = path.join(__dirname, '../../certs');
  
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  console.log(`
📋 لإنشاء شهادة SSL للتطوير، نفذ الأمر التالي:

openssl req -x509 -newkey rsa:4096 -keyout ${certsDir}/key.pem -out ${certsDir}/cert.pem -days 365 -nodes -subj "/CN=localhost"

ثم أضف في ملف .env:
SSL_KEY_PATH=${certsDir}/key.pem
SSL_CERT_PATH=${certsDir}/cert.pem
  `);
};

module.exports = {
  createServer,
  redirectToHttps,
  generateDevCertificate
};
