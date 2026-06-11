#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# سكريبت تحديث المشروع على السيرفر
# ═══════════════════════════════════════════════════════════════

set -e

# الألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}       تحديث نظام إدارة المكفولين${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# طلب المعلومات
read -p "أدخل IP السيرفر: " SERVER_IP

echo ""
echo -e "${YELLOW}📦 بناء Frontend...${NC}"
cd frontend
npm install
npm run build
cd ..
echo -e "${GREEN}✅ تم بناء Frontend${NC}"

echo ""
echo -e "${YELLOW}📦 ضغط الملفات...${NC}"
tar -czf update.tar.gz backend/src frontend/dist backend/package.json
echo -e "${GREEN}✅ تم ضغط الملفات${NC}"

echo ""
echo -e "${YELLOW}📤 رفع التحديث للسيرفر...${NC}"
scp update.tar.gz root@$SERVER_IP:/tmp/
echo -e "${GREEN}✅ تم رفع التحديث${NC}"

echo ""
echo -e "${YELLOW}⚙️  تطبيق التحديث...${NC}"

ssh root@$SERVER_IP << 'ENDSSH'
set -e

echo "إيقاف Backend..."
pm2 stop sponsorship-backend

echo "نسخ احتياطي..."
cp -r /var/www/backend /var/www/backend.backup.$(date +%Y%m%d_%H%M%S)

echo "فك الضغط..."
cd /var/www
tar -xzf /tmp/update.tar.gz
rm /tmp/update.tar.gz

echo "تحديث الحزم..."
cd /var/www/backend
npm install --production

echo "تحديث Frontend..."
cp -r /var/www/frontend/dist/* /var/www/html/

echo "إعادة تشغيل Backend..."
pm2 restart sponsorship-backend

echo "✅ تم التحديث بنجاح!"

ENDSSH

rm update.tar.gz

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}       ✅ تم التحديث بنجاح!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📊 فحص الحالة:${NC}"
ssh root@$SERVER_IP 'pm2 status'
echo ""
