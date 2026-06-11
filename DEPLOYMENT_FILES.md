# 📦 دليل ملفات النشر

هذا الملف يشرح جميع ملفات النشر الموجودة في المشروع واستخداماتها.

## 📋 جدول المحتويات

1. [ملفات Docker](#ملفات-docker)
2. [سكريبتات النشر](#سكريبتات-النشر)
3. [ملفات التكوين](#ملفات-التكوين)
4. [ملفات المنصات السحابية](#ملفات-المنصات-السحابية)
5. [الأدلة والوثائق](#الأدلة-والوثائق)

---

## 🐳 ملفات Docker

### `Dockerfile`
- **الموقع**: الجذر
- **الاستخدام**: بناء صورة Docker للمشروع الكامل (Backend + Frontend)
- **الأمر**: `docker build -t sponsorship-system .`

### `backend/Dockerfile`
- **الموقع**: `backend/`
- **الاستخدام**: بناء صورة Docker للـ Backend فقط
- **الأمر**: `docker build -t sponsorship-backend ./backend`

### `frontend/Dockerfile`
- **الموقع**: `frontend/`
- **الاستخدام**: بناء صورة Docker للـ Frontend فقط
- **الأمر**: `docker build -t sponsorship-frontend ./frontend`

### `docker-compose.yml`
- **الموقع**: الجذر
- **الاستخدام**: تشغيل Backend + Frontend معاً
- **الأمر**: `docker-compose up -d`
- **المميزات**:
  - يشغل Backend على المنفذ 5000
  - يشغل Frontend على المنفذ 80
  - يربط الخدمات ببعضها
  - يحفظ البيانات في volumes

### `.dockerignore`
- **الموقع**: الجذر
- **الاستخدام**: تحديد الملفات المستبعدة من صورة Docker
- **يستبعد**: node_modules, logs, .env, .git

---

## 🚀 سكريبتات النشر

### `deploy-docker.sh`
- **الاستخدام**: نشر المشروع باستخدام Docker Compose
- **الأمر**: `chmod +x deploy-docker.sh && ./deploy-docker.sh`
- **ما يفعله**:
  - يفحص تثبيت Docker
  - ينشئ ملف .env إذا لم يكن موجوداً
  - يبني الصور
  - يشغل الحاويات
  - يعرض حالة النظام

### `deploy-vps.sh`
- **الاستخدام**: نشر تلقائي كامل على VPS
- **الأمر**: `chmod +x deploy-vps.sh && ./deploy-vps.sh`
- **ما يفعله**:
  - يطلب معلومات السيرفر (IP, Domain, Email)
  - يولد مفاتيح آمنة
  - يبني Frontend
  - يرفع الملفات للسيرفر
  - يعد السيرفر تلقائياً (Node.js, Nginx, PM2, Certbot)
  - يحصل على شهادة SSL
  - يشغل النظام

### `deploy.sh`
- **الاستخدام**: سكريبت نشر بسيط (يدوي جزئياً)
- **الأمر**: `chmod +x deploy.sh && ./deploy.sh`
- **ما يفعله**:
  - يبني Frontend
  - يضغط الملفات
  - يرفعها للسيرفر
  - يعرض الخطوات التالية

### `check-deployment.sh`
- **الاستخدام**: فحص جاهزية المشروع للنشر
- **الأمر**: `chmod +x check-deployment.sh && ./check-deployment.sh`
- **ما يفحصه**:
  - تثبيت Node.js و npm
  - وجود ملفات المشروع
  - وجود ملفات النشر
  - إمكانية بناء Frontend
  - إمكانية تشغيل Backend
  - تثبيت Docker (اختياري)

### `update-deployment.sh`
- **الاستخدام**: تحديث المشروع على السيرفر
- **الأمر**: `chmod +x update-deployment.sh && ./update-deployment.sh`
- **ما يفعله**:
  - يبني Frontend الجديد
  - يضغط التحديثات
  - يرفعها للسيرفر
  - يأخذ نسخة احتياطية
  - يطبق التحديث
  - يعيد تشغيل النظام

---

## ⚙️ ملفات التكوين

### `ecosystem.config.js`
- **الاستخدام**: تكوين PM2 لإدارة Backend
- **الأمر**: `pm2 start ecosystem.config.js`
- **المميزات**:
  - إعادة تشغيل تلقائي
  - إدارة السجلات
  - مراقبة الذاكرة
  - إعدادات النشر

### `nginx.conf`
- **الاستخدام**: تكوين Nginx للسيرفر
- **الموقع**: `/etc/nginx/sites-available/sponsorship`
- **المميزات**:
  - Reverse proxy للـ Backend
  - تقديم Frontend الثابت
  - Gzip compression
  - Security headers
  - SSL support

### `frontend/nginx.conf`
- **الاستخدام**: تكوين Nginx داخل Docker للـ Frontend
- **المميزات**:
  - SPA routing
  - Cache للملفات الثابتة
  - Gzip compression

### `.env.example`
- **الاستخدام**: مثال لملف .env لـ Docker Compose
- **الأمر**: `cp .env.example .env`
- **يحتوي على**: JWT_SECRET, ENCRYPTION_KEY, EMAIL_*, CORS_ORIGIN

### `backend/.env.example`
- **الاستخدام**: مثال لملف .env للتطوير
- **الأمر**: `cp backend/.env.example backend/.env`

### `backend/.env.production.example`
- **الاستخدام**: مثال لملف .env للإنتاج
- **الأمر**: `cp backend/.env.production.example backend/.env`

---

## ☁️ ملفات المنصات السحابية

### `vercel.json`
- **المنصة**: Vercel
- **الاستخدام**: نشر Frontend على Vercel
- **الأمر**: `vercel deploy`
- **يحتاج**: Backend منشور على Railway أو منصة أخرى

### `railway.json`
- **المنصة**: Railway
- **الاستخدام**: نشر Backend على Railway
- **الأمر**: يُقرأ تلقائياً عند الربط بـ GitHub

### `render.yaml`
- **المنصة**: Render
- **الاستخدام**: نشر Backend + Frontend على Render
- **الأمر**: يُقرأ تلقائياً عند إنشاء Blueprint

### `Procfile`
- **المنصة**: Heroku
- **الاستخدام**: تحديد أمر التشغيل على Heroku
- **الأمر**: يُقرأ تلقائياً عند النشر

---

## 📚 الأدلة والوثائق

### `DEPLOYMENT.md`
- **اللغة**: English
- **المحتوى**: دليل نشر سريع
- **يشمل**:
  - خيارات النشر الثلاثة
  - بيانات الدخول
  - قائمة التحقق
  - المساعدة

### `دليل_النشر.md`
- **اللغة**: العربية
- **المحتوى**: دليل شامل ومفصل
- **يشمل**:
  - التحضير للنشر
  - النشر على VPS (خطوة بخطوة)
  - النشر على Vercel + Railway
  - النشر على Heroku
  - إعدادات ما بعد النشر
  - استكشاف الأخطاء
  - مقارنة الخيارات

### `CLOUD_DEPLOYMENT.md`
- **اللغة**: العربية
- **المحتوى**: دليل النشر على المنصات السحابية
- **يشمل**:
  - Railway + Vercel
  - Render
  - Heroku
  - DigitalOcean App Platform
  - AWS (EC2 + S3)
  - مقارنة المنصات
  - استكشاف الأخطاء

### `DEPLOYMENT_FILES.md` (هذا الملف)
- **اللغة**: العربية
- **المحتوى**: شرح جميع ملفات النشر

---

## 🎯 متى تستخدم أي ملف؟

### للنشر المحلي (Development)
```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### للنشر باستخدام Docker
```bash
# فحص الجاهزية
./check-deployment.sh

# النشر
./deploy-docker.sh

# أو يدوياً
docker-compose up -d
```

### للنشر على VPS
```bash
# تلقائي (موصى به)
./deploy-vps.sh

# يدوي
# راجع دليل_النشر.md
```

### للنشر على المنصات السحابية
```bash
# Railway + Vercel
# راجع CLOUD_DEPLOYMENT.md قسم Railway + Vercel

# Render
# ارفع المشروع وسيقرأ render.yaml تلقائياً

# Heroku
# راجع CLOUD_DEPLOYMENT.md قسم Heroku
```

### للتحديث
```bash
# على VPS
./update-deployment.sh

# على Docker
docker-compose down
docker-compose build
docker-compose up -d

# على المنصات السحابية
# git push سيحدث تلقائياً
```

---

## 🔧 توليد المفاتيح

جميع سكريبتات النشر تولد المفاتيح تلقائياً، لكن يمكنك توليدها يدوياً:

```bash
# JWT Secret (64 حرف)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Encryption Key (32 حرف)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📊 مخطط تدفق النشر

```
┌─────────────────────────────────────────────────────────────┐
│                    اختر طريقة النشر                         │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
   ┌─────────┐        ┌─────────┐        ┌─────────┐
   │  Docker │        │   VPS   │        │  Cloud  │
   └─────────┘        └─────────┘        └─────────┘
        │                   │                   │
        ▼                   ▼                   ▼
deploy-docker.sh    deploy-vps.sh      CLOUD_DEPLOYMENT.md
        │                   │                   │
        ▼                   ▼                   ▼
docker-compose.yml  ecosystem.config.js  vercel.json
                           │              railway.json
                           ▼              render.yaml
                      nginx.conf
```

---

## 🆘 المساعدة

إذا واجهت مشاكل:

1. **فحص الجاهزية**: `./check-deployment.sh`
2. **راجع الأدلة**:
   - `DEPLOYMENT.md` - دليل سريع
   - `دليل_النشر.md` - دليل شامل
   - `CLOUD_DEPLOYMENT.md` - المنصات السحابية
3. **راجع حل المشاكل**: `دليل_حل_المشاكل.md`
4. **افحص السجلات**:
   - Docker: `docker-compose logs -f`
   - VPS: `ssh root@server 'pm2 logs'`
   - Cloud: راجع لوحة التحكم

---

## ✅ قائمة التحقق النهائية

قبل النشر:
- [ ] فحص الجاهزية: `./check-deployment.sh`
- [ ] توليد مفاتيح آمنة
- [ ] إعداد بريد إلكتروني
- [ ] اختبار محلي
- [ ] مراجعة .gitignore
- [ ] حذف البيانات الحساسة

بعد النشر:
- [ ] تسجيل دخول
- [ ] تغيير كلمة المرور
- [ ] اختبار جميع الميزات
- [ ] إعداد نسخ احتياطي
- [ ] مراقبة السجلات
