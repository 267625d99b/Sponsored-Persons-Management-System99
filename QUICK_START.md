# ⚡ دليل البدء السريع

## 🎯 الهدف

تشغيل نظام إدارة المكفولين في أقل من 5 دقائق!

---

## 📋 المتطلبات

- Node.js 18+ ([تحميل](https://nodejs.org))
- npm (يأتي مع Node.js)

---

## 🚀 الطريقة 1: التشغيل المحلي (للتطوير)

### خطوة واحدة فقط!

```bash
# تثبيت وتشغيل
npm run install:all && npm run dev
```

أو باستخدام Makefile:

```bash
make install && make dev
```

### النتيجة

- ✅ Backend يعمل على: http://localhost:5000
- ✅ Frontend يعمل على: http://localhost:3000

### بيانات الدخول

- **البريد**: admin@example.com
- **كلمة المرور**: Admin@123

⚠️ **غيّر كلمة المرور فوراً!**

---

## 🐳 الطريقة 2: باستخدام Docker (للإنتاج)

### المتطلبات الإضافية

- Docker ([تحميل](https://docs.docker.com/get-docker/))
- Docker Compose

### خطوة واحدة فقط!

```bash
./deploy-docker.sh
```

أو يدوياً:

```bash
docker-compose up -d
```

### النتيجة

- ✅ Frontend يعمل على: http://localhost
- ✅ Backend يعمل على: http://localhost:5000

---

## 🖥️ الطريقة 3: النشر على VPS

### المتطلبات

- VPS (DigitalOcean, Linode, Vultr, إلخ)
- نطاق (Domain) - اختياري لكن موصى به

### خطوة واحدة فقط!

```bash
./deploy-vps.sh
```

السكريبت سيسألك عن:
1. IP السيرفر
2. اسم النطاق
3. بريدك الإلكتروني

ثم سيقوم بكل شيء تلقائياً! ☕

---

## 📱 الوصول للنظام

بعد التشغيل، افتح المتصفح على:

- **محلي**: http://localhost:3000
- **Docker**: http://localhost
- **VPS**: https://yourdomain.com

---

## 🔐 تغيير كلمة المرور

1. سجل دخول بالبيانات الافتراضية
2. اذهب إلى **الإعدادات** → **إدارة الحسابات**
3. اضغط على **تعديل** بجانب حسابك
4. أدخل كلمة المرور الجديدة
5. احفظ

---

## 🎨 الميزات الأساسية

### 1. إضافة مكفول جديد

1. اذهب إلى **المكفولين**
2. اضغط **إضافة مكفول**
3. املأ البيانات
4. احفظ

### 2. تسجيل دفعة

1. افتح صفحة المكفول
2. اذهب إلى تبويب **المدفوعات**
3. اضغط **إضافة دفعة**
4. املأ البيانات
5. احفظ

### 3. عرض التقارير

1. اذهب إلى **التقارير**
2. اختر السنة
3. شاهد الإحصائيات والرسوم البيانية
4. صدّر إلى Excel أو PDF

---

## 🔧 الأوامر المفيدة

### باستخدام npm

```bash
# تثبيت الحزم
npm run install:all

# تشغيل للتطوير
npm run dev

# بناء للإنتاج
npm run build:frontend

# فحص الجاهزية للنشر
npm run deploy:check

# توليد مفاتيح آمنة
npm run generate:keys
```

### باستخدام Makefile

```bash
# عرض جميع الأوامر
make help

# تثبيت
make install

# تشغيل
make dev

# بناء
make build

# فحص
make check

# نشر
make deploy-docker
make deploy-vps

# Docker
make docker-up
make docker-down
make docker-logs

# توليد مفاتيح
make keys
```

### باستخدام Docker

```bash
# تشغيل
docker-compose up -d

# إيقاف
docker-compose down

# عرض السجلات
docker-compose logs -f

# إعادة البناء
docker-compose build

# حالة الحاويات
docker-compose ps
```

---

## 🆘 حل المشاكل السريع

### المشكلة: Backend لا يعمل

```bash
# افحص السجلات
cd backend
npm run dev
```

### المشكلة: Frontend لا يتصل بـ Backend

1. تأكد من Backend يعمل على المنفذ 5000
2. افحص ملف `frontend/src/services/api.ts`
3. تأكد من CORS_ORIGIN صحيح في Backend

### المشكلة: Docker لا يعمل

```bash
# افحص حالة Docker
docker --version
docker-compose --version

# افحص السجلات
docker-compose logs -f

# إعادة البناء
docker-compose down
docker-compose build
docker-compose up -d
```

### المشكلة: نسيت كلمة المرور

راجع ملف `دليل_حل_المشاكل.md` قسم "نسيان كلمة المرور"

---

## 📚 المزيد من المعلومات

- `README.md` - معلومات عامة
- `DEPLOYMENT.md` - دليل النشر السريع
- `دليل_النشر.md` - دليل شامل بالعربي
- `CLOUD_DEPLOYMENT.md` - النشر على المنصات السحابية
- `DEPLOYMENT_FILES.md` - شرح ملفات النشر
- `دليل_حل_المشاكل.md` - حل المشاكل الشائعة

---

## ✅ قائمة التحقق

- [ ] تثبيت Node.js 18+
- [ ] تثبيت npm
- [ ] (للـ Docker) تثبيت Docker و Docker Compose
- [ ] (للـ VPS) الحصول على VPS ونطاق
- [ ] تشغيل النظام
- [ ] تسجيل الدخول
- [ ] تغيير كلمة المرور
- [ ] إضافة مكفول تجريبي
- [ ] اختبار الميزات

---

## 🎉 مبروك!

الآن لديك نظام إدارة مكفولين يعمل بكامل طاقته! 🚀

للدعم والمساعدة، راجع الملفات الموثقة أو افحص السجلات.
