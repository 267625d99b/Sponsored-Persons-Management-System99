// ═══════════════════════════════════════════════════════════════
// تكوين PM2 لنظام إدارة المكفولين
// ═══════════════════════════════════════════════════════════════
// 
// الاستخدام:
// pm2 start ecosystem.config.js
// pm2 save
// pm2 startup
// ═══════════════════════════════════════════════════════════════

module.exports = {
  apps: [
    {
      name: 'sponsorship-backend',
      cwd: './backend',
      script: 'src/server.js',
      
      // بيئة التشغيل
      env: {
        NODE_ENV: 'production',
      },
      
      // عدد النسخ (instances)
      instances: 1,
      exec_mode: 'fork',
      
      // إعادة التشغيل التلقائي
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      
      // السجلات
      error_file: './backend/logs/pm2-error.log',
      out_file: './backend/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // إعادة التشغيل عند الفشل
      min_uptime: '10s',
      max_restarts: 10,
      
      // Cron لإعادة التشغيل اليومي (اختياري)
      // cron_restart: '0 3 * * *',
      
      // متغيرات البيئة (يمكن تجاوزها من ملف .env)
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
  
  // إعدادات النشر (اختياري)
  deploy: {
    production: {
      user: 'root',
      host: 'YOUR_SERVER_IP',
      ref: 'origin/main',
      repo: 'YOUR_GIT_REPO',
      path: '/var/www',
      'post-deploy': 'cd backend && npm install && pm2 reload ecosystem.config.js --env production',
    },
  },
};
