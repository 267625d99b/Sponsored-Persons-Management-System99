# 🚀 دليل النشر المجاني للأبد

## المنصات المستخدمة
- **Backend**: [Render.com](https://render.com) — مجاني للأبد
- **Frontend**: [Vercel.com](https://vercel.com) — مجاني للأبد
- **Database**: SQLite على Render Disk — 1GB مجاناً

---

## الخطوة 1: رفع الكود على GitHub

1. اذهب إلى [github.com](https://github.com) وأنشئ حساباً مجانياً
2. أنشئ مستودعاً (Repository) جديداً خاصاً (Private)
3. افتح terminal في مجلد المشروع وشغّل:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/REPO-NAME.git
git push -u origin main
```

---

## الخطوة 2: نشر الباكند على Render

1. اذهب إلى [render.com](https://render.com) وأنشئ حساباً مجانياً
2. اضغط **"New +"** ثم **"Web Service"**
3. اربط حساب GitHub واختر المستودع
4. اضبط الإعدادات:
   - **Name**: `sponsorship-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

5. في قسم **Environment Variables** أضف:
   | المتغير | القيمة |
   |---------|--------|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `JWT_SECRET` | (اضغط Generate للحصول على قيمة عشوائية) |
   | `ENCRYPTION_KEY` | (اضغط Generate) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CORS_ORIGIN` | (اتركه فارغاً الآن، سنضيفه بعد نشر الفرونتيند) |
   | `RENDER_DATA_PATH` | `/opt/render/project/src/data` |

6. في قسم **Disks** اضغط **"Add Disk"**:
   - **Name**: `sponsorship-data`
   - **Mount Path**: `/opt/render/project/src/data`
   - **Size**: `1 GB`

7. اضغط **"Create Web Service"**
8. انتظر حتى يكتمل النشر (2-5 دقائق)
9. **احفظ الرابط** مثل: `https://sponsorship-backend.onrender.com`

---

## الخطوة 3: نشر الفرونتيند على Vercel

1. **أولاً:** عدّل ملف `frontend/.env.production`:
   ```
   VITE_API_URL=https://sponsorship-backend.onrender.com/api
   ```
   (ضع رابط الباكند الذي حصلت عليه في الخطوة السابقة)

2. ارفع التعديل على GitHub:
   ```bash
   git add .
   git commit -m "Update backend URL"
   git push
   ```

3. اذهب إلى [vercel.com](https://vercel.com) وأنشئ حساباً مجانياً
4. اضغط **"New Project"** واختر المستودع من GitHub
5. اضبط الإعدادات:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. في قسم **Environment Variables** أضف:
   | المتغير | القيمة |
   |---------|--------|
   | `VITE_API_URL` | `https://sponsorship-backend.onrender.com/api` |

7. اضغط **"Deploy"**
8. **احفظ رابط الفرونتيند** مثل: `https://sponsorship-management.vercel.app`

---

## الخطوة 4: ربط الفرونتيند بالباكند (CORS)

1. ارجع إلى [Render Dashboard](https://dashboard.render.com)
2. افتح خدمة الباكند > **Environment**
3. عدّل متغير `CORS_ORIGIN`:
   ```
   https://sponsorship-management.vercel.app
   ```
4. اضغط **"Save Changes"** — سيتم إعادة النشر تلقائياً

---

## ✅ انتهى! روابطك:
- **الفرونتيند**: `https://sponsorship-management.vercel.app`
- **الباكند**: `https://sponsorship-backend.onrender.com`
- **بيانات الدخول الافتراضية**:
  - Email: `admin@example.com`
  - Password: `Admin@123`

---

## ⚠️ ملاحظات مهمة

### Render Free Plan
- السيرفر يدخل في **وضع السكون** بعد 15 دقيقة من عدم الاستخدام
- أول طلب بعد السكون يأخذ **30-60 ثانية** للاستجابة (طبيعي)
- **الحل**: يمكن استخدام [UptimeRobot](https://uptimerobot.com) مجاناً لإبقاء السيرفر مستيقظاً بإرسال ping كل 14 دقيقة

### UptimeRobot (اختياري لإبقاء السيرفر مستيقظاً)
1. اذهب إلى [uptimerobot.com](https://uptimerobot.com) وأنشئ حساباً مجانياً
2. أضف Monitor جديد:
   - **Type**: HTTP(s)
   - **URL**: `https://sponsorship-backend.onrender.com/api/health`
   - **Interval**: 14 minutes
3. هذا سيبقي السيرفر مستيقظاً دائماً 🎉

### البيانات
- قاعدة البيانات محفوظة على Render Disk (1GB مجاناً)
- البيانات لا تُحذف عند إعادة النشر
- يُنصح بأخذ نسخة احتياطية دورياً من لوحة التحكم

---

## 🔄 تحديث المشروع لاحقاً
عند تعديل الكود، فقط شغّل:
```bash
git add .
git commit -m "وصف التعديل"
git push
```
Render وVercel سيعيدان النشر تلقائياً ✨
