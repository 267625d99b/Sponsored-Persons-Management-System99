# ═══════════════════════════════════════════════════════════════
# Dockerfile للـ Backend
# ═══════════════════════════════════════════════════════════════

FROM node:18-alpine

# إنشاء مستخدم غير root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# نسخ ملفات package
COPY package*.json ./

# تثبيت الحزم
RUN npm ci --production

# نسخ باقي الملفات
COPY . .

# إنشاء المجلدات المطلوبة
RUN mkdir -p data uploads backups logs && \
    chown -R nodejs:nodejs /app

# التبديل للمستخدم غير root
USER nodejs

# المنفذ
EXPOSE 5000

# متغيرات البيئة
ENV NODE_ENV=production \
    PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# نقطة الدخول
CMD ["node", "src/server.js"]
