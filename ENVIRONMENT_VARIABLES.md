# 🔐 دليل المتغيرات البيئية

هذا الملف يشرح جميع المتغيرات البيئية المستخدمة في النظام.

---

## 📋 جدول المحتويات

1. [Backend Environment Variables](#backend-environment-variables)
2. [Frontend Environment Variables](#frontend-environment-variables)
3. [Docker Compose Environment Variables](#docker-compose-environment-variables)
4. [توليد المفاتيح الآمنة](#توليد-المفاتيح-الآمنة)

---

## 🔧 Backend Environment Variables

### ملف: `backend/.env`

#### المتغيرات الإلزامية

| المتغير | الوصف | مثال | ملاحظات |
|---------|-------|------|---------|
| `NODE_ENV` | بيئة التشغيل | `production` أو `development` | **مهم**: استخدم `production` للإنتاج |
| `PORT` | منفذ Backend | `5000` | المنفذ الافتراضي |
| `JWT_SECRET` | مفتاح JWT | `64 حرف عشوائي` | **مهم جداً**: ولّد مفتاح جديد! |
| `ENCRYPTION_KEY` | مفتاح التشفير | `32 حرف عشوائي` | **مهم جداً**: ولّد مفتاح جديد! |

#### المتغيرات الاختيارية

| المتغير | الوصف | القيمة الافتراضية | ملاحظات |
|---------|-------|-------------------|---------|
| `JWT_EXPIRES_IN` | مدة صلاحية JWT | `7d` | يمكن: `1h`, `24h`, `7d`, `30d` |
| `CORS_ORIGIN` | النطاقات المسموحة | `http://localhost:3000` | للإنتاج: `https://yourdomain.com` |

#### إعدادات البريد الإلكتروني (للـ 2FA)

| المتغير | الوصف | مثال | ملاحظات |
|---------|-------|------|---------|
| `EMAIL_SERVICE` | خدمة البريد | `gmail` | يدعم: gmail, outlook, yahoo |
| `EMAIL_USER` | البريد الإلكتروني | `your_email@gmail.com` | **مطلوب للـ 2FA** |
| `EMAIL_PASS` | كلمة مرور التطبيق | `xxxx xxxx xxxx xxxx` | **ليس كلمة المرور العادية!** |

> **ملاحظة**: لـ Gmail، يجب إنشاء "App Password" من إعدادات الحساب.

#### إعدادات SSL (اختياري)

| المتغير | الوصف | مثال |
|---------|-------|------|
| `SSL_KEY_PATH` | مسار المفتاح الخاص | `/path/to/private.key` |
| `SSL_CERT_PATH` | مسار الشهادة | `/path/to/certificate.crt` |

### مثال كامل: `backend/.env`

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Configuration
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
JWT_EXPIRES_IN=7d

# Encryption Key
ENCRYPTION_KEY=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p

# Email Configuration (2FA)
EMAIL_SERVICE=gmail
EMAIL_USER=admin@example.com
EMAIL_PASS=abcd efgh ijkl mnop

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# SSL Configuration (optional)
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

---

## 🎨 Frontend Environment Variables

### ملف: `frontend/.env` أو `frontend/.env.production`

| المتغير | الوصف | مثال | ملاحظات |
|---------|-------|------|---------|
| `VITE_API_URL` | عنوان Backend API | `http://localhost:5000` | للإنتاج: `https://yourdomain.com` |

### مثال: `frontend/.env.production`

```env
VITE_API_URL=https://yourdomain.com
```

> **ملاحظة**: متغيرات Vite يجب أن تبدأ بـ `VITE_`

---

## 🐳 Docker Compose Environment Variables

### ملف: `.env` (في الجذر)

هذا الملف يُستخدم بواسطة `docker-compose.yml`

```env
# JWT Configuration
JWT_SECRET=your_generated_64_char_jwt_secret_key_here
ENCRYPTION_KEY=your_generated_32_char_encryption_key_here

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# CORS Configuration
CORS_ORIGIN=http://localhost

# API URL for Frontend
VITE_API_URL=http://localhost:5000
```

---

## 🔐 توليد المفاتيح الآمنة

### الطريقة 1: باستخدام Node.js

```bash
# JWT Secret (64 حرف)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Encryption Key (32 حرف)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### الطريقة 2: باستخدام npm script

```bash
npm run generate:keys
```

### الطريقة 3: باستخدام Makefile

```bash
make keys
```

### الطريقة 4: باستخدام OpenSSL

```bash
# JWT Secret (64 حرف)
openssl rand -hex 64

# Encryption Key (32 حرف)
openssl rand -hex 32
```

---

## 📝 إعداد Gmail App Password

لاستخدام Gmail للـ 2FA:

1. اذهب إلى [Google Account](https://myaccount.google.com)
2. اختر **Security** → **2-Step Verification**
3. فعّل المصادقة الثنائية إذا لم تكن مفعلة
4. اذهب إلى **App passwords**
5. اختر **Mail** و **Other (Custom name)**
6. أدخل اسم التطبيق (مثلاً: "Sponsorship System")
7. اضغط **Generate**
8. انسخ كلمة المرور المكونة من 16 حرف
9. استخدمها في `EMAIL_PASS`

---

## 🔄 تحديث المتغيرات البيئية

### على VPS

```bash
# تعديل ملف .env
ssh root@your-server
cd /var/www/backend
nano .env

# إعادة تشغيل Backend
pm2 restart sponsorship-backend
```

### على Docker

```bash
# تعديل ملف .env
nano .env

# إعادة تشغيل الحاويات
docker-compose down
docker-compose up -d
```

### على المنصات السحابية

- **Railway**: Dashboard → Variables → Add Variable
- **Render**: Dashboard → Environment → Add Environment Variable
- **Heroku**: `heroku config:set VARIABLE_NAME=value`
- **Vercel**: Dashboard → Settings → Environment Variables

---

## ⚠️ تحذيرات أمنية

### ❌ لا تفعل

- ❌ لا تشارك ملف `.env` مع أحد
- ❌ لا ترفع ملف `.env` إلى Git
- ❌ لا تستخدم نفس المفاتيح في التطوير والإنتاج
- ❌ لا تستخدم كلمة مرور Gmail العادية في `EMAIL_PASS`
- ❌ لا تستخدم مفاتيح ضعيفة أو قصيرة

### ✅ افعل

- ✅ ولّد مفاتيح جديدة لكل بيئة
- ✅ استخدم App Password لـ Gmail
- ✅ احفظ المفاتيح في مكان آمن
- ✅ غيّر المفاتيح دورياً
- ✅ استخدم `.env.example` كمرجع فقط

---

## 📊 مقارنة البيئات

| المتغير | Development | Production |
|---------|-------------|------------|
| `NODE_ENV` | `development` | `production` |
| `PORT` | `5000` | `5000` أو حسب المنصة |
| `JWT_SECRET` | مفتاح تطوير | **مفتاح إنتاج قوي** |
| `ENCRYPTION_KEY` | مفتاح تطوير | **مفتاح إنتاج قوي** |
| `CORS_ORIGIN` | `http://localhost:3000` | `https://yourdomain.com` |
| `EMAIL_*` | اختياري | **مطلوب** |
| `SSL_*` | غير مطلوب | **موصى به** |

---

## 🔍 فحص المتغيرات

### Backend

```bash
cd backend
node -e "require('dotenv').config(); console.log(process.env)"
```

### Frontend

```bash
cd frontend
npm run build
# المتغيرات ستكون مضمنة في الملفات المبنية
```

---

## 🆘 استكشاف الأخطاء

### المشكلة: JWT_SECRET غير موجود

```
Error: JWT_SECRET is required
```

**الحل**: أضف `JWT_SECRET` في ملف `.env`

### المشكلة: ENCRYPTION_KEY غير صحيح

```
Error: Invalid key length
```

**الحل**: تأكد من أن `ENCRYPTION_KEY` بطول 32 حرف بالضبط (64 حرف hex)

### المشكلة: البريد الإلكتروني لا يعمل

```
Error: Invalid login
```

**الحل**: 
1. تأكد من استخدام App Password وليس كلمة المرور العادية
2. تأكد من تفعيل 2FA في حساب Gmail
3. تأكد من `EMAIL_SERVICE` صحيح

### المشكلة: CORS Error

```
Access to XMLHttpRequest has been blocked by CORS policy
```

**الحل**: تأكد من `CORS_ORIGIN` في Backend يطابق عنوان Frontend

---

## 📚 المزيد من المعلومات

- `backend/.env.example` - مثال للتطوير
- `backend/.env.production.example` - مثال للإنتاج
- `.env.example` - مثال لـ Docker Compose
- `DEPLOYMENT.md` - دليل النشر
- `دليل_حل_المشاكل.md` - حل المشاكل
