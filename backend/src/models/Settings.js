const { dbRun, dbGet, dbAll } = require('../config/db');
const { encrypt, decrypt } = require('../middleware/security');

const defaultSettings = {
  currency: 'SAR',
  currencySymbol: 'ريال',
  currencyPosition: 'after',
  dateFormat: 'ar-SA',
  renewalReminderDays: 30,
  enableEmailNotifications: false,
  enableSmsNotifications: false,
  enable2FA: true,
  organizationName: 'نظام إدارة المكفولين',
  language: 'ar',
  emailService: 'gmail',
  emailUser: '',
  emailPass: ''
};

const Settings = {
  // تهيئة إعدادات tenant جديد
  initForTenant: (tenantId) => {
    return dbRun(`
      INSERT OR IGNORE INTO settings (tenant_id, currency, currency_symbol, currency_position, date_format, renewal_reminder_days, enable_email_notifications, enable_sms_notifications, organization_name, language)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tenantId,
      defaultSettings.currency,
      defaultSettings.currencySymbol,
      defaultSettings.currencyPosition,
      defaultSettings.dateFormat,
      defaultSettings.renewalReminderDays,
      0, 0,
      defaultSettings.organizationName,
      defaultSettings.language
    ]);
  },

  get: async (tenantId) => {
    const obj = await dbGet('SELECT * FROM settings WHERE tenant_id = ?', [tenantId]);

    if (!obj) {
      await Settings.initForTenant(tenantId);
      return defaultSettings;
    }

    return {
      currency: obj.currency || defaultSettings.currency,
      currencySymbol: obj.currency_symbol || defaultSettings.currencySymbol,
      currencyPosition: obj.currency_position || defaultSettings.currencyPosition,
      dateFormat: obj.date_format || defaultSettings.dateFormat,
      renewalReminderDays: obj.renewal_reminder_days || defaultSettings.renewalReminderDays,
      enableEmailNotifications: obj.enable_email_notifications === 1,
      enableSmsNotifications: obj.enable_sms_notifications === 1,
      enable2FA: obj.enable_2fa === 1 || obj.enable_2fa === undefined,
      organizationName: obj.organization_name || defaultSettings.organizationName,
      language: obj.language || defaultSettings.language,
      emailService: obj.email_service || defaultSettings.emailService,
      emailUser: obj.email_user || '',
      emailConfigured: !!(obj.email_user && obj.email_pass)
    };
  },

  getEmailConfig: async (tenantId) => {
    try {
      const row = await dbGet(
        'SELECT email_service, email_user, email_pass FROM settings WHERE tenant_id = ?',
        [tenantId]
      );

      if (!row || !row.email_user || !row.email_pass) return null;

      let pass = null;
      try { pass = decrypt(row.email_pass); } catch { pass = null; }

      return { service: row.email_service || 'gmail', user: row.email_user, pass };
    } catch { return null; }
  },

  update: async (data, tenantId) => {
    // تحقق أولاً هل الإعداد موجود
    const existing = await dbGet('SELECT id FROM settings WHERE tenant_id = ?', [tenantId]);
    if (existing) {
      await dbRun(`
        UPDATE settings SET
          currency = ?,
          currency_symbol = ?,
          currency_position = ?,
          date_format = ?,
          renewal_reminder_days = ?,
          enable_email_notifications = ?,
          enable_sms_notifications = ?,
          enable_2fa = ?,
          organization_name = ?,
          language = ?,
          updated_at = datetime('now')
        WHERE tenant_id = ?
      `, [
        data.currency || defaultSettings.currency,
        data.currencySymbol || defaultSettings.currencySymbol,
        data.currencyPosition || defaultSettings.currencyPosition,
        data.dateFormat || defaultSettings.dateFormat,
        data.renewalReminderDays || defaultSettings.renewalReminderDays,
        data.enableEmailNotifications ? 1 : 0,
        data.enableSmsNotifications ? 1 : 0,
        data.enable2FA !== false ? 1 : 0,
        data.organizationName || defaultSettings.organizationName,
        data.language || defaultSettings.language,
        tenantId
      ]);
    } else {
      await dbRun(`
        INSERT INTO settings (tenant_id, currency, currency_symbol, currency_position, date_format, renewal_reminder_days, enable_email_notifications, enable_sms_notifications, enable_2fa, organization_name, language, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        tenantId,
        data.currency || defaultSettings.currency,
        data.currencySymbol || defaultSettings.currencySymbol,
        data.currencyPosition || defaultSettings.currencyPosition,
        data.dateFormat || defaultSettings.dateFormat,
        data.renewalReminderDays || defaultSettings.renewalReminderDays,
        data.enableEmailNotifications ? 1 : 0,
        data.enableSmsNotifications ? 1 : 0,
        data.enable2FA !== false ? 1 : 0,
        data.organizationName || defaultSettings.organizationName,
        data.language || defaultSettings.language
      ]);
    }
    return Settings.get(tenantId);
  },

  updateEmailConfig: async (emailService, emailUser, emailPass, tenantId) => {
    const encryptedPass = emailPass ? encrypt(emailPass) : null;
    const existing = await dbGet('SELECT id FROM settings WHERE tenant_id = ?', [tenantId]);
    if (existing) {
      await dbRun(`
        UPDATE settings SET
          email_service = ?,
          email_user = ?,
          email_pass = ?,
          updated_at = datetime('now')
        WHERE tenant_id = ?
      `, [emailService || 'gmail', emailUser || null, encryptedPass, tenantId]);
    } else {
      await dbRun(`
        INSERT INTO settings (tenant_id, email_service, email_user, email_pass, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `, [tenantId, emailService || 'gmail', emailUser || null, encryptedPass]);
    }
    return Settings.get(tenantId);
  }
};

module.exports = Settings;
