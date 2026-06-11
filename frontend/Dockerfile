# ═══════════════════════════════════════════════════════════════
# Dockerfile للـ Frontend
# ═══════════════════════════════════════════════════════════════

# المرحلة 1: بناء المشروع
FROM node:18-alpine AS builder

WORKDIR /app

# نسخ ملفات package
COPY package*.json ./

# تثبيت الحزم
RUN npm ci

# نسخ باقي الملفات
COPY . .

# بناء المشروع
RUN npm run build

# المرحلة 2: Nginx
FROM nginx:alpine

# نسخ الملفات المبنية
COPY --from=builder /app/dist /usr/share/nginx/html

# نسخ تكوين nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# المنافذ
EXPOSE 80 443

# نقطة الدخول
CMD ["nginx", "-g", "daemon off;"]
