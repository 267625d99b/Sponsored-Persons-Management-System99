const nodemailer = require('nodemailer');

// الحصول على إعدادات البريد (من قاعدة البيانات أو .env)
// tenantId اختياري — إذا مُرر يجلب إعدادات ذلك المستخدم تحديداً
const getEmailCredentials = async (tenantId = null) => {
  // أولاً: محاولة الحصول من قاعدة البيانات
  try {
    const Settings = require('../models/Settings');
    const dbConfig = await Settings.getEmailConfig(tenantId);
    if (dbConfig && dbConfig.user && dbConfig.pass) {
      return dbConfig;
    }
  } catch (e) {
    // قاعدة البيانات غير جاهزة بعد
  }
  
  // ثانياً: استخدام متغيرات البيئة
  const envEmail = process.env.EMAIL_USER;
  if (envEmail && process.env.EMAIL_PASS) {
    return {
      service: process.env.EMAIL_SERVICE || 'gmail',
      user: envEmail,
      pass: process.env.EMAIL_PASS
    };
  }
  
  return null;
};

// إعداد transporter للبريد
const createTransporter = async (tenantId = null) => {
  const credentials = await getEmailCredentials(tenantId);
  
  if (!credentials) {
    return null;
  }
  
  return nodemailer.createTransport({
    service: credentials.service || 'gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: credentials.user,
      pass: credentials.pass
    }
  });
};

// الحصول على بريد المرسل
const getSenderEmail = async (tenantId = null) => {
  const credentials = await getEmailCredentials(tenantId);
  return credentials?.user || '';
};

// قالب البريد الأساسي
const getEmailTemplate = (title, content) => `
  <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">${title}</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
      ${content}
      
      <hr style="border: none; border-top: 1px solid #e9ecef; margin: 25px 0;">
      
      <p style="font-size: 12px; color: #999; text-align: center;">
        نظام إدارة المكفولين - جميع الحقوق محفوظة
      </p>
    </div>
  </div>
`;

// إرسال رمز التحقق
const sendVerificationCode = async (email, code, adminName, tenantId = null) => {
  const transporter = await createTransporter(tenantId);
  if (!transporter) {
    return { success: false, error: 'Email not configured' };
  }

  const senderEmail = await getSenderEmail(tenantId);
  const content = `
    <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
      مرحباً <strong>${adminName || 'المستخدم'}</strong>،
    </p>
    
    <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
      تم طلب تسجيل الدخول إلى حسابك. استخدم الرمز التالي للتحقق:
    </p>
    
    <div style="background: #1e3a5f; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
      <span style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px;">${code}</span>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
      ⏱️ هذا الرمز صالح لمدة <strong>5 دقائق</strong> فقط.
    </p>
    
    <p style="font-size: 14px; color: #666;">
      ⚠️ إذا لم تطلب تسجيل الدخول، تجاهل هذا البريد.
    </p>
  `;

  const mailOptions = {
    from: `"نظام إدارة المكفولين" <${senderEmail}>`,
    to: email,
    subject: '🔐 رمز التحقق لتسجيل الدخول',
    html: getEmailTemplate('🔐 رمز التحقق', content)
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// إرسال تذكير بتجديد الكفالة
const sendRenewalReminder = async (email, sponsoredName, daysUntilRenewal, amount) => {
  const transporter = await createTransporter();
  if (!transporter) {
    return { success: false, error: 'Email not configured' };
  }

  const senderEmail = await getSenderEmail();
  const content = `
    <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
      تذكير بموعد تجديد الكفالة
    </p>
    
    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-right: 4px solid #ffc107; margin: 20px 0;">
      <p style="margin: 0; color: #856404;">
        <strong>📅 كفالة "${sponsoredName}"</strong> تحتاج تجديد خلال <strong>${daysUntilRenewal} يوم</strong>
      </p>
    </div>
    
    <p style="font-size: 16px; color: #333;">
      قيمة الكفالة السنوية: <strong>${amount}</strong>
    </p>
  `;

  const mailOptions = {
    from: `"نظام إدارة المكفولين" <${senderEmail}>`,
    to: email,
    subject: `📅 تذكير: تجديد كفالة ${sponsoredName}`,
    html: getEmailTemplate('📅 تذكير تجديد الكفالة', content)
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// إرسال تنبيه بالمدفوعات المتأخرة
const sendOverdueAlert = async (email, overdueList) => {
  const transporter = await createTransporter();
  if (!transporter) {
    return { success: false, error: 'Email not configured' };
  }

  const senderEmail = await getSenderEmail();
  const listHtml = overdueList.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; color: #dc3545;">${item.remaining}</td>
    </tr>
  `).join('');

  const content = `
    <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
      يوجد <strong style="color: #dc3545;">${overdueList.length}</strong> مكفول لم يكتمل دفع كفالتهم لهذا العام:
    </p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background: #f8f9fa;">
          <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">الاسم</th>
          <th style="padding: 10px; text-align: right; border-bottom: 2px solid #dee2e6;">المتبقي</th>
        </tr>
      </thead>
      <tbody>
        ${listHtml}
      </tbody>
    </table>
  `;

  const mailOptions = {
    from: `"نظام إدارة المكفولين" <${senderEmail}>`,
    to: email,
    subject: `⚠️ تنبيه: ${overdueList.length} مدفوعات متأخرة`,
    html: getEmailTemplate('⚠️ مدفوعات متأخرة', content)
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// إرسال رسالة مخصصة
const sendCustomEmail = async (to, subject, message) => {
  const transporter = await createTransporter();
  if (!transporter) {
    return { success: false, error: 'Email not configured' };
  }

  const senderEmail = await getSenderEmail();
  const content = `
    <div style="font-size: 16px; color: #333; white-space: pre-wrap;">
      ${message.replace(/\n/g, '<br>')}
    </div>
  `;

  const mailOptions = {
    from: `"نظام إدارة المكفولين" <${senderEmail}>`,
    to: to,
    subject: subject,
    html: getEmailTemplate('📧 رسالة من نظام المكفولين', content)
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// اختبار إعدادات البريد
const testEmailConfig = async (testEmail, tenantId = null) => {
  const transporter = await createTransporter(tenantId);
  if (!transporter) {
    return { success: false, error: 'إعدادات البريد غير مكتملة' };
  }

  const senderEmail = await getSenderEmail(tenantId);
  const content = `
    <p style="font-size: 16px; color: #333;">
      ✅ تم إعداد البريد الإلكتروني بنجاح!
    </p>
    <p style="font-size: 14px; color: #666;">
      هذه رسالة اختبار للتأكد من عمل إعدادات البريد.
    </p>
  `;

  const mailOptions = {
    from: `"نظام إدارة المكفولين" <${senderEmail}>`,
    to: testEmail || senderEmail,
    subject: '✅ اختبار إعدادات البريد',
    html: getEmailTemplate('✅ اختبار البريد', content)
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'تم إرسال رسالة الاختبار بنجاح' };
  } catch (error) {
    console.error('Email test error:', error);
    return { success: false, error: error.message };
  }
};

// توليد رمز عشوائي من 6 أرقام
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// التحقق من إعداد البريد
const isEmailConfigured = async (tenantId = null) => {
  const credentials = await getEmailCredentials(tenantId);
  return !!(credentials && credentials.user && credentials.pass);
};

// إرسال إشعار ذكي بالبريد
const sendNotificationEmail = async ({ subject, title, message, details = [], urgent = false }) => {
  const transporter = await createTransporter();
  if (!transporter) {
    return { success: false, error: 'Email not configured' };
  }

  // الحصول على جميع المدراء
  const { dbAll } = require('./db');
  const admins = await dbAll('SELECT email FROM admins');
  
  if (!admins || admins.length === 0) {
    return { success: false, error: 'No admins found' };
  }

  const adminEmails = admins.map(row => row.email);
  const senderEmail = await getSenderEmail();

  // بناء محتوى البريد
  const detailsHtml = details.length > 0 ? `
    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
      ${details.map(detail => `
        <p style="margin: 5px 0; color: #495057; font-size: 14px;">
          ${detail}
        </p>
      `).join('')}
    </div>
  ` : '';

  const urgentBadge = urgent ? `
    <div style="background: #dc3545; color: white; padding: 10px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
      <strong>🚨 عاجل - يتطلب اهتمام فوري</strong>
    </div>
  ` : '';

  const content = `
    ${urgentBadge}
    
    <p style="font-size: 18px; color: #333; margin-bottom: 20px; font-weight: 600;">
      ${message}
    </p>
    
    ${detailsHtml}
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
         style="background: #1e3a5f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
        فتح النظام
      </a>
    </div>
  `;

  const mailOptions = {
    from: `"نظام إدارة المكفولين" <${senderEmail}>`,
    to: adminEmails.join(', '),
    subject: subject,
    html: getEmailTemplate(title, content),
    priority: urgent ? 'high' : 'normal'
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Notification email error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationCode,
  sendRenewalReminder,
  sendOverdueAlert,
  sendCustomEmail,
  testEmailConfig,
  generateVerificationCode,
  isEmailConfigured,
  sendNotificationEmail
};
