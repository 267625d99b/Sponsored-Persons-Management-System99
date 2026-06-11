#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# سكريبت نشر باستخدام Docker Compose
# ═══════════════════════════════════════════════════════════════

set -e

# الألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}       نشر نظام إدارة المكفولين باستخدام Docker${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# فحص Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker غير مثبت!${NC}"
    echo "يرجى تثبيت Docker أولاً: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose غير مثبت!${NC}"
    echo "يرجى تثبيت Docker Compose أولاً: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker و Docker Compose مثبتان${NC}"
echo ""

# فحص ملف .env
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  ملف .env غير موجود${NC}"
    echo -e "${YELLOW}📝 إنشاء ملف .env...${NC}"
    
    # توليد المفاتيح
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    cat > .env << EOF
# JWT Configuration
JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY

# Email Configuration (عدّل هذه القيم!)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# CORS Configuration
CORS_ORIGIN=http://localhost

# API URL
VITE_API_URL=http://localhost:5000
EOF
    
    echo -e "${GREEN}✅ تم إنشاء ملف .env${NC}"
    echo -e "${YELLOW}⚠️  يرجى تعديل إعدادات البريد الإلكتروني في ملف .env${NC}"
    echo ""
fi

# بناء الصور
echo -e "${YELLOW}🔨 بناء صور Docker...${NC}"
docker-compose build
echo -e "${GREEN}✅ تم بناء الصور${NC}"
echo ""

# تشغيل الحاويات
echo -e "${YELLOW}🚀 تشغيل الحاويات...${NC}"
docker-compose up -d
echo -e "${GREEN}✅ تم تشغيل الحاويات${NC}"
echo ""

# انتظار بدء الخدمات
echo -e "${YELLOW}⏳ انتظار بدء الخدمات...${NC}"
sleep 10

# فحص الحالة
echo -e "${YELLOW}📊 حالة الحاويات:${NC}"
docker-compose ps
echo ""

# عرض السجلات
echo -e "${YELLOW}📝 آخر السجلات:${NC}"
docker-compose logs --tail=20
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}       ✅ تم النشر بنجاح!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📝 معلومات الوصول:${NC}"
echo "  - الموقع: http://localhost"
echo "  - API: http://localhost:5000/api"
echo ""
echo -e "${BLUE}🔐 بيانات الدخول الافتراضية:${NC}"
echo "  - البريد: admin@example.com"
echo "  - كلمة المرور: Admin@123"
echo ""
echo -e "${YELLOW}⚠️  غيّر كلمة المرور فوراً بعد تسجيل الدخول!${NC}"
echo ""
echo -e "${BLUE}📊 أوامر مفيدة:${NC}"
echo "  - عرض السجلات: docker-compose logs -f"
echo "  - إيقاف الحاويات: docker-compose down"
echo "  - إعادة التشغيل: docker-compose restart"
echo "  - حالة الحاويات: docker-compose ps"
echo ""
