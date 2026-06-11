# 🆓 دليل النشر المجاني 100%

## 🎯 الهدف

نشر نظام إدارة المكفولين **مجاناً بالكامل** بدون أي تكاليف!

---

## ⭐ الخيار الموصى به: Render (الأفضل)

### المميزات
- ✅ **مجاني 100%** للأبد
- ✅ Backend + Frontend في مكان واحد
- ✅ SSL تلقائي مجاني
- ✅ قاعدة بيانات SQLite تعمل بشكل ممتاز
- ✅ CI/CD تلقائي من GitHub
- ✅ لا يحتاج بطاقة ائتمان

### العيوب
- ⚠️ يتوقف بعد 15 دقيقة من عدم النشاط (يعود للعمل تلقائياً عند الزيارة)
- ⚠️ بطيء قليلاً في أول زيارة بعد التوقف

---

## 🚀 خطوات النشر على Render

### الخطوة 1: رفع المشروع على GitHub

```bash
# إذا لم يكن لديك Git repository
git init
git add .
git commit -m "Initial commit"

# إنشاء repository على GitHub ثم
git remote add origin https://github.com/username/your-repo.git
git push -u origin main
```

### الخطوة 2: إنشاء حساب على Render

1. اذهب إلى [render.com](https://render.com)
2. اضغط **Get Started for Free**
3. سجل دخول بحساب GitHub

### الخطوة 3: نشر Backend

1. من لوحة التحكم، اضغط **New +** → **Web Service**
2. اختر المشروع من GitHub
3. املأ البيانات:

```
Name: sponsorship-backend
Region: Frankfurt (أو الأقرب لك)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: node src/server.js
```

4. اختر **Free Plan**
5. أضف المتغيرات البيئية (Environment Variables):

```env
NODE_ENV=production
PORT=10000
JWT_SECRET=<اضغط Generate لتوليد مفتاح>
ENCRYPTION_KEY=<اضغط Generate لتوليد مفتاح>
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CORS_ORIGIN=https://sponsorship-frontend.onrender.com
```

> **ملاحظة**: سنحدث `CORS_ORIGIN` لاحقاً بعد نشر Frontend

6. اضغط **Create Web Service**
7. انتظر حتى ينتهي النشر (5-10 دقائق)
8. انسخ الـ URL (مثلاً: `https://sponsorship-backend.onrender.com`)

### الخطوة 4: نشر Frontend

1. من لوحة التحكم، اضغط **New +** → **Static Site**
2. اختر نفس المشروع من GitHub
3. املأ البيانات:

```
Name: sponsorship-frontend
Region: Frankfurt (أو الأقرب لك)
Branch: main
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

4. أضف متغير بيئي واحد:

```env
VITE_API_URL=https://sponsorship-backend.onrender.com
```

> **مهم**: استبدل الـ URL بالـ URL الذي حصلت عليه من Backend

5. اضغط **Create Static Site**
6. انتظر حتى ينتهي النشر (3-5 دقائق)

### الخطوة 5: تحديث CORS

1. ارجع لـ Backend في Render
2. اذهب إلى **Environment**
3. حدّث `CORS_ORIGIN` إلى URL الـ Frontend (مثلاً: `https://sponsorship-frontend.onrender.com`)
4. احفظ التغييرات (سيعيد النشر تلقائياً)

### الخطوة 6: الوصول للنظام

افتح المتصفح على: `https://sponsorship-frontend.onrender.com`

**بيانات الدخول:**
- البريد: `admin@example.com`
- كلمة المرور: `Admin@123`

⚠️ **غيّر كلمة المرور فوراً!**

---

## 🎨 خيارات مجانية أخرى

### الخيار 2: Vercel + Railway

#### المميزات
- ✅ مجاني
- ✅ سريع جداً
- ✅ CI/CD تلقائي

#### الخطوات

**1. نشر Backend على Railway:**

1. اذهب إلى [railway.app](https://railway.app)
2. سجل دخول بحساب GitHub
3. اضغط **New Project** → **Deploy from GitHub repo**
4. اختر المشروع
5. اضغط **Add variables** وأضف:

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

6. في **Settings** → **Root Directory**: اكتب `backend`
7. في **Settings** → **Start Command**: اكتب `node src/server.js`
8. انسخ الـ URL

**2. نشر Frontend على Vercel:**

1. اذهب إلى [vercel.com](https://vercel.com)
2. سجل دخول بحساب GitHub
3. اضغط **Add New** → **Project**
4. اختر المشروع
5. في **Configure Project**:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. أضف متغير بيئي:
   ```
   VITE_API_URL=<Railway URL>
   ```
7. اضغط **Deploy**

**3. تحديث CORS:**

ارجع لـ Railway وحدّث `CORS_ORIGIN` إلى URL الـ Vercel

---

### الخيار 3: Netlify + Railway

مشابه للخيار 2، لكن استخدم Netlify بدلاً من Vercel.

---

## 🔐 إعداد Gmail App Password

لاستخدام البريد الإلكتروني مجاناً:

1. اذهب إلى [myaccount.google.com](https://myaccount.google.com)
2. **Security** → **2-Step Verification** (فعّله)
3. **App passwords** → **Select app**: Mail
4. **Select device**: Other → اكتب "Sponsorship System"
5. اضغط **Generate**
6. انسخ كلمة المرور (16 حرف)
7. استخدمها في `EMAIL_PASS`

---

## 📊 مقارنة الخيارات المجانية

| الميزة | Render | Vercel + Railway | Netlify + Railway |
|--------|--------|------------------|-------------------|
| التكلفة | مجاني | مجاني | مجاني |
| الصعوبة | سهل جداً ⭐ | متوسط | متوسط |
| السرعة | متوسط | سريع | سريع |
| التوقف | بعد 15 دقيقة | بعد 15 دقيقة | بعد 15 دقيقة |
| SSL | تلقائي | تلقائي | تلقائي |
| CI/CD | تلقائي | تلقائي | تلقائي |

---

## ⚡ نصائح لتحسين الأداء المجاني

### 1. منع التوقف (Keep Alive)

أضف خدمة مجانية لزيارة موقعك كل 10 دقائق:

- [UptimeRobot](https://uptimerobot.com) - مجاني
- [Cron-job.org](https://cron-job.org) - مجاني

**الإعداد:**
1. سجل في UptimeRobot
2. أضف Monitor جديد
3. URL: `https://your-backend.onrender.com/api/health`
4. Interval: 5 دقائق

### 2. تحسين وقت التحميل

في `backend/src/server.js`، الـ health check موجود بالفعل:

```javascript
app.get('/api/health', async (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

### 3. ضغط الصور

استخدم خدمات مجانية لضغط الصور قبل رفعها:
- [TinyPNG](https://tinypng.com)
- [Squoosh](https://squoosh.app)

---

## 🔄 التحديث التلقائي

عند عمل `git push` إلى GitHub، سيتم النشر تلقائياً!

```bash
# بعد التعديل
git add .
git commit -m "Update feature"
git push

# Render/Vercel/Railway سيحدث تلقائياً
```

---

## 📱 ربط نطاق مخصص (اختياري)

### على Render

1. اذهب إلى **Settings** → **Custom Domain**
2. أضف نطاقك (مثلاً: `myapp.com`)
3. أضف CNAME record في إعدادات النطاق:
   ```
   CNAME: www -> your-app.onrender.com
   ```

### نطاقات مجانية

- [Freenom](https://www.freenom.com) - نطاقات مجانية (.tk, .ml, .ga)
- [InfinityFree](https://infinityfree.net) - استضافة + نطاق فرعي مجاني

---

## 🆘 حل المشاكل الشائعة

### المشكلة: Backend يتوقف بعد 15 دقيقة

**الحل**: استخدم UptimeRobot كما شرحنا أعلاه

### المشكلة: قاعدة البيانات تُحذف

**الحل**: Render يحفظ الملفات في الخطة المجانية، لكن:
- قم بتحميل نسخة احتياطية دورياً من لوحة التحكم
- أو استخدم خدمة تخزين سحابية مجانية

### المشكلة: بطء في أول زيارة

**الحل**: هذا طبيعي في الخطة المجانية. استخدم UptimeRobot لإبقاء الموقع نشطاً

### المشكلة: CORS Error

**الحل**: تأكد من `CORS_ORIGIN` في Backend يطابق URL الـ Frontend بالضبط

---

## 📦 النسخ الاحتياطي المجاني

### الطريقة 1: تحميل يدوي

1. سجل دخول للنظام
2. اذهب إلى **الإعدادات** → **النسخ الاحتياطي**
3. اضغط **إنشاء نسخة احتياطية**
4. حمّل الملف

### الطريقة 2: GitHub Actions (تلقائي)

أضف workflow للنسخ الاحتياطي التلقائي (متقدم)

---

## 🎉 مبروك!

الآن لديك نظام إدارة مكفولين يعمل **مجاناً 100%**! 🚀

### الخطوات التالية:

1. ✅ سجل دخول وغيّر كلمة المرور
2. ✅ أضف بريدك الإلكتروني
3. ✅ اختبر جميع الميزات
4. ✅ أعد UptimeRobot لمنع التوقف
5. ✅ احفظ نسخة احتياطية دورياً

---

## 📞 الدعم

إذا واجهت مشاكل:
- راجع `دليل_حل_المشاكل.md`
- افحص السجلات في لوحة تحكم Render
- تأكد من جميع المتغيرات البيئية صحيحة

---

## 💡 نصيحة أخيرة

الخطة المجانية ممتازة للبداية والاستخدام الشخصي. إذا احتجت أداء أفضل لاحقاً، يمكنك الترقية بسهولة.

**تكلفة الترقية (اختياري):**
- Render: $7/شهر (لا يتوقف أبداً)
- Railway: $5/شهر
- Vercel: مجاني للأبد للـ Frontend

لكن للاستخدام العادي، **الخطة المجانية كافية تماماً!** ✨
