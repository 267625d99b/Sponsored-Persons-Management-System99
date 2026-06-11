const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { dbRun, dbGet, dbAll, dbPath, backupsDir } = require('./db');
const logger = require('./logger');
const { sendNotificationEmail } = require('./email');

// النسخ الاحتياطي التلقائي
const autoBackup = async () => {
  try {
    // إنشاء اسم الملف
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `auto_backup_${timestamp}.db`;
    const backupPath = path.join(backupsDir, filename);

    // إنشاء نسخة احتياطية باستخدام VACUUM INTO
    try {
      await dbRun('VACUUM INTO ?', [backupPath]);
    } catch (e) {
      console.error('VACUUM INTO failed, falling back to copy:', e);
      fs.copyFileSync(dbPath, backupPath);
    }

    const fileSize = fs.statSync(backupPath).size;

    // تسجيل النسخة في قاعدة البيانات
    await dbRun(`
      INSERT INTO backups (filename, file_size, type)
      VALUES (?, ?, 'auto')
    `, [filename, fileSize]);

    logger.info(`✅ Auto backup created: ${filename} (${(fileSize / 1024).toFixed(1)} KB)`);

    // حذف النسخ القديمة (الاحتفاظ بآخر 7 نسخ تلقائية)
    await cleanOldBackups();
  } catch (error) {
    logger.error('❌ Auto backup failed:', error);
  }
};

// حذف النسخ الاحتياطية القديمة
const cleanOldBackups = async () => {
  try {
    const backups = await dbAll(`
      SELECT id, filename FROM backups 
      WHERE type = 'auto' 
      ORDER BY created_at DESC
    `);

    // حذف ما يزيد عن 7 نسخ
    if (backups.length > 7) {
      const toDelete = backups.slice(7);
      for (const backup of toDelete) {
        const filePath = path.join(backupsDir, backup.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        await dbRun('DELETE FROM backups WHERE id = ?', [backup.id]);
      }
      logger.info(`🗑️ Cleaned ${toDelete.length} old auto backups`);
    }
  } catch (error) {
    logger.error('Error cleaning old backups:', error);
  }
};

// فحص التجديدات القريبة وإنشاء إشعارات ذكية
const checkRenewalsAndOverdue = async () => {
  try {
    const Notification = require('../models/Notification');
    const Settings = require('../models/Settings');
    
    // جلب كل المستخدمين (tenants)
    const tenants = await dbAll("SELECT id, tenant_id FROM admins WHERE role != 'superadmin' AND tenant_id IS NOT NULL");
    // أضف الـ superadmin أيضاً (tenant_id = id)
    const superadmin = await dbGet("SELECT id FROM admins WHERE role = 'superadmin' LIMIT 1");
    const allTenants = [...tenants.map(t => t.tenant_id)];
    if (superadmin) allTenants.push(superadmin.id);

    let totalNotifications = 0;
    let totalEmails = 0;

    for (const tenantId of allTenants) {
      const settings = await Settings.get(tenantId);
      const reminderDays = settings?.renewalReminderDays || 30;
      const emailEnabled = settings?.enableEmailNotifications;

      // 1. المكفولين قريبي التجديد
      const upcoming = await dbAll(`
        SELECT id, full_name, sponsorship_start_date, annual_amount, tenant_id
        FROM sponsored 
        WHERE status = 'active' AND tenant_id = ?
        AND date(sponsorship_start_date, '+1 year') BETWEEN date('now') AND date('now', '+${reminderDays} days')
      `, [tenantId]);

      for (const s of upcoming) {
        const renewalDate = new Date(s.sponsorship_start_date);
        renewalDate.setFullYear(renewalDate.getFullYear() + 1);
        const daysUntil = Math.ceil((renewalDate - new Date()) / (1000 * 60 * 60 * 24));

        await Notification.createForAll({
          type: 'renewal',
          title: '🔔 تجديد كفالة قريب',
          message: `كفالة "${s.full_name}" تحتاج تجديد خلال ${daysUntil} يوم (${renewalDate.toLocaleDateString('ar-SA')})`,
          entityType: 'sponsored',
          entityId: s.id,
          tenantId
        });
        totalNotifications++;

        if (emailEnabled) {
          try {
            await sendNotificationEmail({
              subject: '🔔 تذكير: تجديد كفالة قريب',
              title: 'تجديد كفالة قريب',
              message: `كفالة "${s.full_name}" تحتاج تجديد خلال ${daysUntil} يوم`,
              details: [
                `المكفول: ${s.full_name}`,
                `تاريخ التجديد: ${renewalDate.toLocaleDateString('ar-SA')}`,
                `المبلغ السنوي: ${s.annual_amount.toLocaleString('ar-SA')} ريال`,
                `الأيام المتبقية: ${daysUntil} يوم`
              ],
              tenantId
            });
            totalEmails++;
          } catch (error) {
            logger.error('Failed to send renewal email:', error.message);
          }
        }
      }

      // 2. المتأخرين عن الدفع
      const currentYear = new Date().getFullYear();
      const overdue = await dbAll(`
        SELECT s.id, s.full_name, s.annual_amount,
          COALESCE((SELECT SUM(amount) FROM payments WHERE sponsored_id = s.id AND year = ${currentYear} AND tenant_id = s.tenant_id), 0) as paid
        FROM sponsored s
        WHERE s.status = 'active' AND s.tenant_id = ?
        AND paid < s.annual_amount
      `, [tenantId]);

      if (overdue.length > 0) {
        const totalRemaining = overdue.reduce((sum, r) => sum + (r.annual_amount - r.paid), 0);
        await Notification.createForAll({
          type: 'overdue',
          title: '⚠️ تنبيه: مدفوعات متأخرة',
          message: `يوجد ${overdue.length} مكفول لم يكتمل دفع كفالتهم لهذا العام (${totalRemaining.toLocaleString('ar-SA')} ريال متبقي)`,
          entityType: 'system',
          entityId: null,
          tenantId
        });
        totalNotifications++;
      }
    }

    // حذف الإشعارات القديمة
    await Notification.deleteOld(30);
    logger.info(`✅ Smart notifications: ${totalNotifications} notifications, ${totalEmails} emails`);
  } catch (error) {
    logger.error('Error checking renewals:', error);
  }
};

// فحص سريع للتجديدات العاجلة (خلال 7 أيام)
const checkUrgentRenewals = async () => {
  try {
    const Notification = require('../models/Notification');
    const Settings = require('../models/Settings');

    const tenants = await dbAll("SELECT tenant_id FROM admins WHERE role != 'superadmin' AND tenant_id IS NOT NULL");
    const superadmin = await dbGet("SELECT id FROM admins WHERE role = 'superadmin' LIMIT 1");
    const allTenants = [...tenants.map(t => t.tenant_id)];
    if (superadmin) allTenants.push(superadmin.id);

    let urgentCount = 0;

    for (const tenantId of allTenants) {
      const settings = await Settings.get(tenantId);
      const emailEnabled = settings?.enableEmailNotifications;

      const urgent = await dbAll(`
        SELECT id, full_name, sponsorship_start_date, annual_amount
        FROM sponsored 
        WHERE status = 'active' AND tenant_id = ?
        AND date(sponsorship_start_date, '+1 year') BETWEEN date('now') AND date('now', '+7 days')
      `, [tenantId]);

      for (const s of urgent) {
        const renewalDate = new Date(s.sponsorship_start_date);
        renewalDate.setFullYear(renewalDate.getFullYear() + 1);
        const daysUntil = Math.ceil((renewalDate - new Date()) / (1000 * 60 * 60 * 24));

        await Notification.createForAll({
          type: 'urgent',
          title: '🚨 تجديد عاجل!',
          message: `كفالة "${s.full_name}" تحتاج تجديد خلال ${daysUntil} يوم فقط!`,
          entityType: 'sponsored',
          entityId: s.id,
          tenantId
        });
        urgentCount++;

        if (emailEnabled) {
          try {
            await sendNotificationEmail({
              subject: '🚨 عاجل: تجديد كفالة خلال أيام',
              title: 'تجديد عاجل!',
              message: `كفالة "${s.full_name}" تحتاج تجديد خلال ${daysUntil} يوم فقط!`,
              details: [
                `المكفول: ${s.full_name}`,
                `تاريخ التجديد: ${renewalDate.toLocaleDateString('ar-SA')}`,
                `المبلغ السنوي: ${s.annual_amount.toLocaleString('ar-SA')} ريال`,
                `⚠️ الأيام المتبقية: ${daysUntil} يوم فقط`
              ],
              urgent: true,
              tenantId
            });
          } catch (error) {
            logger.error('Failed to send urgent email:', error.message);
          }
        }
      }
    }

    if (urgentCount > 0) {
      logger.info(`🚨 Urgent renewals: ${urgentCount} found`);
    }
  } catch (error) {
    logger.error('Error checking urgent renewals:', error);
  }
};

// جدولة المهام
const initScheduler = () => {
  // نسخ احتياطي يومي الساعة 2 صباحاً
  cron.schedule('0 2 * * *', () => {
    logger.info('⏰ Running scheduled auto backup...');
    autoBackup();
  }, {
    timezone: 'Asia/Riyadh'
  });

  // فحص التجديدات والمتأخرين يومياً الساعة 8 صباحاً
  cron.schedule('0 8 * * *', () => {
    logger.info('⏰ Running smart notifications check...');
    checkRenewalsAndOverdue();
  }, {
    timezone: 'Asia/Riyadh'
  });

  // فحص التجديدات العاجلة كل 6 ساعات
  cron.schedule('0 */6 * * *', () => {
    logger.info('⏰ Checking urgent renewals...');
    checkUrgentRenewals();
  }, {
    timezone: 'Asia/Riyadh'
  });

  // تنظيف الإشعارات القديمة أسبوعياً (كل يوم أحد الساعة 3 صباحاً)
  cron.schedule('0 3 * * 0', () => {
    logger.info('⏰ Cleaning old notifications...');
    const Notification = require('../models/Notification');
    Notification.deleteOld(30);
  }, {
    timezone: 'Asia/Riyadh'
  });

  logger.info('📅 Scheduler initialized:');
  logger.info('  - Auto backup: Daily at 2:00 AM');
  logger.info('  - Smart notifications: Daily at 8:00 AM');
  logger.info('  - Urgent renewals: Every 6 hours');
  logger.info('  - Cleanup: Weekly on Sunday at 3:00 AM');
};

// تشغيل نسخة احتياطية يدوياً
const runManualBackup = () => {
  autoBackup();
};

module.exports = { 
  initScheduler, 
  runManualBackup, 
  autoBackup, 
  checkRenewalsAndOverdue,
  checkUrgentRenewals
};
