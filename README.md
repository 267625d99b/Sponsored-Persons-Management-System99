# نظام إدارة المكفولين

نظام ويب متكامل لإدارة المكفولين وتتبع الكفالات والمدفوعات.

## ✨ المميزات

- 📊 لوحة تحكم شاملة بالإحصائيات
- 👥 إدارة المكفولين (إضافة، تعديل، حذف)
- 💰 تتبع المدفوعات والكفالات السنوية
- 📄 إدارة المستندات والملفات
- 📈 تقارير سنوية وإحصائيات
- 🔐 نظام مصادقة آمن مع 2FA
- 🌙 دعم الوضع الليلي
- 📱 تصميم متجاوب

## 🛠️ المتطلبات

- Node.js v18+

## 🚀 التشغيل المحلي

### 1. إعداد Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

### 2. إعداد Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. فتح التطبيق

افتح المتصفح على: http://localhost:3000

**بيانات الدخول الافتراضية:**
- البريد: `admin@example.com`
- كلمة المرور: تظهر في console عند أول تشغيل

## 🚀 النشر للإنتاج

### 🆓 النشر المجاني 100% (موصى به للبداية) ⭐

**أسرع طريقة:**
```bash
chmod +x deploy-free.sh
./deploy-free.sh
```

ثم اتبع التعليمات لرفع المشروع على GitHub والنشر على Render.

**الأدلة المتوفرة:**
- 📘 `نشر_مجاني.md` - دليل خطوة بخطوة بالعربي ⭐⭐⭐⭐⭐
- 📗 `FREE_DEPLOYMENT.md` - دليل كامل بالإنجليزية
- 📊 `مقارنة_النشر_المجاني.md` - مقارنة بين الخيارات المجانية
- 📋 `ملخص_النشر.md` - ملخص شامل لجميع الخيارات

**المنصات المجانية المدعومة:**
- ✅ **Render** (الأفضل) - Backend + Frontend مجاناً
- ✅ **Vercel + Railway** - سريع ومجاني
- ✅ **Netlify + Railway** - بديل ممتاز

---

### خيارات النشر الأخرى

#### 1️⃣ النشر باستخدام Docker

```bash
# فحص الجاهزية
chmod +x check-deployment.sh
./check-deployment.sh

# النشر
chmod +x deploy-docker.sh
./deploy-docker.sh
```

#### 2️⃣ النشر على VPS

```bash
chmod +x deploy-vps.sh
./deploy-vps.sh
```

السكريبت سيقوم بكل شيء تلقائياً:
- ✅ إعداد السيرفر
- ✅ تثبيت المتطلبات
- ✅ توليد مفاتيح آمنة
- ✅ الحصول على SSL
- ✅ تشغيل النظام

### 📚 فهرس شامل لجميع الأدلة

راجع ملف `INDEX.md` للوصول السريع لجميع الأدلة والوثائق.

### 📖 أدلة النشر التفصيلية

- 🆓 `نشر_مجاني.md` - **النشر المجاني 100%** (ابدأ هنا) ⭐
- 📊 `مقارنة_النشر_المجاني.md` - مقارنة الخيارات المجانية
- 📋 `ملخص_النشر.md` - ملخص شامل
- 📗 `FREE_DEPLOYMENT.md` - النشر المجاني (English)
- 📘 `DEPLOYMENT.md` - دليل النشر السريع
- 📕 `دليل_النشر.md` - دليل شامل بالعربي
- 📙 `CLOUD_DEPLOYMENT.md` - النشر على المنصات السحابية
- 📓 `QUICK_START.md` - البدء السريع

### 🔐 إعدادات مهمة للإنتاج

- ✅ تغيير `NODE_ENV=production`
- ✅ توليد `JWT_SECRET` قوي (64 حرف)
- ✅ توليد `ENCRYPTION_KEY` قوي (32 حرف)
- ✅ إعداد شهادة SSL
- ✅ تغيير `CORS_ORIGIN` للدومين الخاص بك
- ✅ تغيير كلمة المرور الافتراضية فوراً

## 📁 هيكل المشروع

```
├── backend/
│   ├── src/
│   │   ├── config/       # إعدادات (DB, Email, Logger)
│   │   ├── controllers/  # معالجات الطلبات
│   │   ├── middleware/   # الوسطاء (Auth, Security)
│   │   ├── models/       # نماذج البيانات
│   │   └── routes/       # مسارات API
│   ├── data/             # قاعدة البيانات SQLite
│   └── uploads/          # الملفات المرفوعة
│
└── frontend/
    └── src/
        ├── components/   # المكونات
        ├── pages/        # الصفحات
        ├── context/      # React Context
        ├── services/     # API calls
        └── types/        # TypeScript types
```

## 🔒 الأمان

- ✅ Rate Limiting
- ✅ Helmet Security Headers
- ✅ Input Sanitization
- ✅ JWT Authentication
- ✅ 2FA بالبريد الإلكتروني
- ✅ تشفير البيانات الحساسة
- ✅ CORS Protection
- ✅ Compression

## 📝 License

MIT
