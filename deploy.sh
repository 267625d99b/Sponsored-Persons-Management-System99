#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# سكريبت نشر نظام إدارة المكفولين على VPS
# ═══════════════════════════════════════════════════════════════

set -e

echo "🚀 بدء عملية النشر..."

# الألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# المتغيرات
SERVER_IP=""
DOMAIN=""
EMAIL=""

# طلب المعلومات من المستخدم
read -p "أدخل IP السيرفر: " SERVER_IP
read -p "أدخل اسم النطاق (domain): " DOMAIN
read -p "أدخل بريدك الإلكتروني: " EMAIL

echo -e "${YELLOW}📦 تحضير الملفات...${NC}"

# بناء Frontend
cd frontend
npm install
npm run build
cd ..

# ضغط المشروع
tar -czf project.tar.gz backend frontend

echo -e "${GREEN}✅ تم تحضير الملفات${NC}"

echo -e "${YELLOW}📤 رفع الملفات للسيرفر...${NC}"

# رفع للسيرفر
scp project.tar.gz root@$SERVER_IP:/tmp/

echo -e "${GREEN}✅ تم رفع الملفات${NC}"

echo -e "${YELLOW}⚙️ إعداد السيرفر...${NC}"

# تنفيذ الأوامر على السيرفر
ssh root@$SERVER_IP << 'ENDSSH'

# تحديث النظام
apt update && apt upgrade -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# تثبيت Nginx
apt install -y nginx

# تثبيت Certbot
apt install -y certbot python3-certbot-nginx

# تثبيت PM2
npm install -g pm2

# إنشاء المجلدات
mkdir -p /var/www
cd /var/www

# فك الضغط
tar -xzf /tmp/project.tar.gz

# إعداد Backend
cd /var/www/backend
npm install --production

echo "⚠️  يرجى إنشاء ملف .env يدوياً بالمفاتيح الآمنة"

# إعداد Frontend
cd /var/www/frontend
cp -r dist/* /var/www/html/

echo "✅ تم إعداد السيرفر"

ENDSSH

echo -e "${GREEN}✅ تم النشر بنجاح!${NC}"
echo -e "${YELLOW}📝 الخطوات التالية:${NC}"
echo "1. سجل دخول للسيرفر: ssh root@$SERVER_IP"
echo "2. أنشئ ملف .env في /var/www/backend"
echo "3. شغّل Backend: cd /var/www/backend && pm2 start src/server.js --name sponsorship"
echo "4. أعد Nginx: nano /etc/nginx/sites-available/sponsorship"
echo "5. احصل على SSL: certbot --nginx -d $DOMAIN"
