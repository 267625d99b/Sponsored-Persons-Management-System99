# ═══════════════════════════════════════════════════════════════
# Dockerfile لنظام إدارة المكفولين
# ═══════════════════════════════════════════════════════════════
# 
# الاستخدام:
# docker build -t sponsorship-system .
# docker run -p 5000:5000 -p 3000:80 sponsorship-system
# ═══════════════════════════════════════════════════════════════

# المرحلة 1: بناء Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# نسخ ملفات package
COPY frontend/package*.json ./

# تثبيت الحزم
RUN npm ci

# نسخ باقي الملفات
COPY frontend/ ./

# بناء المشروع
RUN npm run build

# المرحلة 2: بناء Backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# نسخ ملفات package
COPY backend/package*.json ./

# تثبيت الحزم (production only)
RUN npm ci --production

# نسخ باقي الملفات
COPY backend/ ./

# المرحلة 3: الصورة النهائية
FROM node:18-alpine

# تثبيت nginx
RUN apk add --no-cache nginx

# إنشاء مستخدم غير root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# نسخ Backend
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend ./backend

# نسخ Frontend المبني
COPY --from=frontend-builder --chown=nodejs:nodejs /app/frontend/dist ./frontend/dist

# نسخ تكوين nginx
COPY nginx.conf /etc/nginx/http.d/default.conf

# إنشاء المجلدات المطلوبة
RUN mkdir -p /app/backend/data \
             /app/backend/uploads \
             /app/backend/backups \
             /app/backend/logs && \
    chown -R nodejs:nodejs /app

# التبديل للمستخدم غير root
USER nodejs

# المنافذ
EXPOSE 5000 80

# متغيرات البيئة الافتراضية
ENV NODE_ENV=production \
    PORT=5000

# نقطة الدخول
CMD ["sh", "-c", "nginx && node backend/src/server.js"]
