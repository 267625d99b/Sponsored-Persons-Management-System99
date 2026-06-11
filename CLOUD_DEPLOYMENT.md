# ☁️ دليل النشر على المنصات السحابية

## 📋 جدول المحتويات

1. [Railway + Vercel](#railway--vercel)
2. [Render](#render)
3. [Heroku](#heroku)
4. [DigitalOcean App Platform](#digitalocean-app-platform)
5. [AWS (EC2 + S3)](#aws-ec2--s3)

---

## 🚂 Railway + Vercel

### المميزات
- ✅ مجاني للبداية
- ✅ سهل جداً
- ✅ CI/CD تلقائي
- ✅ SSL مجاني

### الخطوات

#### 1. نشر Backend على Railway

1. اذهب إلى [railway.app](https://railway.app)
2. سجل دخول بحساب GitHub
3. اضغط "New Project" → "Deploy from GitHub repo"
4. اختر المشروع
5. أضف المتغيرات البيئية:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=<ولّد مفتاح 64 حرف>
ENCRYPTION_KEY=<ولّد مفتاح 32 حرف>
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CORS_ORIGIN=https://your-app.vercel.app
```

6. انسخ الـ URL الذي يعطيك إياه Railway

#### 2. نشر Frontend على Vercel

1. اذهب إلى [vercel.com](https://vercel.com)
2. سجل دخول بحساب GitHub
3. اضغط "Add New" → "Project"
4. اختر المشروع
5. في إعدادات Build:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. أضف متغير بيئي:
   ```
   VITE_API_URL=https://your-railway-url.railway.app
   ```
7. اضغط "Deploy"

#### 3. تحديث CORS

ارجع لـ Railway وحدّث `CORS_ORIGIN` إلى URL الـ Vercel الخاص بك.

---

## 🎨 Render

### المميزات
- ✅ مجاني للبداية
- ✅ Backend + Frontend في مكان واحد
- ✅ SSL تلقائي
- ✅ قاعدة بيانات PostgreSQL مجانية (اختياري)

### الخطوات

1. اذهب إلى [render.com](https://render.com)
2. سجل دخول بحساب GitHub
3. اضغط "New" → "Blueprint"
4. اختر المشروع
5. Render سيقرأ ملف `render.yaml` تلقائياً
6. أضف المتغيرات البيئية المطلوبة:
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - `CORS_ORIGIN` (سيتم تحديثه تلقائياً)
7. اضغط "Apply"

### ملاحظات
- Backend سيكون على: `https://sponsorship-backend.onrender.com`
- Frontend سيكون على: `https://sponsorship-frontend.onrender.com`
- الخطة المجانية تتوقف بعد 15 دقيقة من عدم النشاط

---

## 🟣 Heroku

### المميزات
- ✅ سهل الاستخدام
- ✅ إدارة تلقائية
- ⚠️ لم يعد مجانياً ($7/شهر)

### الخطوات

#### 1. تثبيت Heroku CLI

```bash
# Windows
# قم بتحميله من heroku.com

# Mac
brew install heroku/brew/heroku

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

#### 2. تسجيل الدخول

```bash
heroku login
```

#### 3. نشر Backend

```bash
cd backend

# إنشاء تطبيق
heroku create your-app-name-backend

# إضافة المتغيرات البيئية
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
heroku config:set ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
heroku config:set EMAIL_SERVICE=gmail
heroku config:set EMAIL_USER=your_email@gmail.com
heroku config:set EMAIL_PASS=your_app_password

# نشر
git init
git add .
git commit -m "Deploy backend"
git push heroku main
```

#### 4. نشر Frontend

```bash
cd frontend

# تحديث API URL
echo "VITE_API_URL=https://your-app-name-backend.herokuapp.com" > .env.production

# إنشاء تطبيق
heroku create your-app-name-frontend

# إضافة buildpack
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-static

# إنشاء static.json
cat > static.json << 'EOF'
{
  "root": "dist",
  "clean_urls": true,
  "routes": {
    "/**": "index.html"
  }
}
EOF

# نشر
git init
git add .
git commit -m "Deploy frontend"
git push heroku main
```

---

## 🌊 DigitalOcean App Platform

### المميزات
- ✅ سهل الاستخدام
- ✅ أداء جيد
- ✅ $5/شهر للبداية

### الخطوات

1. اذهب إلى [DigitalOcean](https://www.digitalocean.com)
2. اضغط "Create" → "Apps"
3. اختر GitHub واختر المشروع
4. أضف مكونين:
   - **Backend**: Node.js
     - Build Command: `cd backend && npm install --production`
     - Run Command: `cd backend && node src/server.js`
     - HTTP Port: 5000
   - **Frontend**: Static Site
     - Build Command: `cd frontend && npm install && npm run build`
     - Output Directory: `frontend/dist`
5. أضف المتغيرات البيئية للـ Backend
6. اضغط "Create Resources"

---

## ☁️ AWS (EC2 + S3)

### المميزات
- ✅ تحكم كامل
- ✅ قابل للتوسع
- ⚠️ يتطلب خبرة

### الخطوات

#### 1. إنشاء EC2 Instance

1. اذهب إلى AWS Console → EC2
2. اضغط "Launch Instance"
3. اختر Ubuntu Server 22.04 LTS
4. اختر t2.micro (مجاني للسنة الأولى)
5. أنشئ Key Pair جديد
6. في Security Group، افتح المنافذ:
   - 22 (SSH)
   - 80 (HTTP)
   - 443 (HTTPS)
   - 5000 (Backend)
7. اضغط "Launch"

#### 2. الاتصال بالسيرفر

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-ec2-ip
```

#### 3. إعداد السيرفر

استخدم سكريبت `deploy-vps.sh` أو اتبع الخطوات اليدوية في `دليل_النشر.md`

#### 4. نشر Frontend على S3 (اختياري)

```bash
# تثبيت AWS CLI
pip install awscli

# تكوين AWS
aws configure

# بناء Frontend
cd frontend
npm run build

# رفع لـ S3
aws s3 sync dist/ s3://your-bucket-name --acl public-read

# تفعيل Static Website Hosting
aws s3 website s3://your-bucket-name --index-document index.html
```

---

## 📊 مقارنة المنصات

| المنصة | التكلفة | الصعوبة | الأداء | التحكم | مناسب لـ |
|--------|---------|---------|--------|--------|----------|
| Railway + Vercel | مجاني-$5 | سهل جداً | جيد | محدود | النماذج الأولية |
| Render | مجاني-$7 | سهل | جيد | محدود | المشاريع الصغيرة |
| Heroku | $7+ | سهل | جيد | محدود | المشاريع المتوسطة |
| DigitalOcean | $5+ | متوسط | ممتاز | جيد | المشاريع المتوسطة |
| AWS | متغير | صعب | ممتاز | كامل | المشاريع الكبيرة |

---

## 🔧 توليد المفاتيح الآمنة

قبل النشر، ولّد مفاتيح آمنة:

```bash
# JWT Secret (64 حرف)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Encryption Key (32 حرف)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📝 قائمة التحقق

قبل النشر على أي منصة:

- [ ] ولّد مفاتيح JWT و Encryption جديدة
- [ ] أعد بريد إلكتروني للـ 2FA
- [ ] حدّث CORS_ORIGIN
- [ ] اختبر المشروع محلياً
- [ ] راجع ملف .gitignore
- [ ] احذف أي بيانات حساسة

---

## 🆘 استكشاف الأخطاء

### المشكلة: Backend لا يعمل

1. افحص السجلات على المنصة
2. تأكد من جميع المتغيرات البيئية
3. تأكد من PORT صحيح

### المشكلة: Frontend لا يتصل بـ Backend

1. تأكد من VITE_API_URL صحيح
2. تأكد من CORS_ORIGIN في Backend
3. افحص Network في Developer Tools

### المشكلة: قاعدة البيانات تُحذف

بعض المنصات تحذف الملفات عند إعادة النشر. الحلول:
- استخدم قاعدة بيانات خارجية (PostgreSQL)
- استخدم Volume/Persistent Storage
- قم بنسخ احتياطي دوري

---

## 📞 الدعم

للمزيد من المعلومات:
- `دليل_النشر.md` - دليل VPS الشامل
- `DEPLOYMENT.md` - دليل النشر السريع
- `دليل_حل_المشاكل.md` - حل المشاكل
