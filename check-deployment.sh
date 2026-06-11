#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# سكريبت فحص جاهزية المشروع للنشر
# ═══════════════════════════════════════════════════════════════

set -e

# الألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}       فحص جاهزية نظام إدارة المكفولين للنشر${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

ERRORS=0
WARNINGS=0

# دالة للفحص
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        ((ERRORS++))
    fi
}

check_warning() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${YELLOW}⚠️  $1${NC}"
        ((WARNINGS++))
    fi
}

# 1. فحص Node.js
echo -e "${BLUE}📦 فحص المتطلبات...${NC}"
command -v node > /dev/null 2>&1
check "Node.js مثبت"

if command -v node > /dev/null 2>&1; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        echo -e "${GREEN}✅ إصدار Node.js مناسب ($NODE_VERSION)${NC}"
    else
        echo -e "${RED}❌ إصدار Node.js قديم ($NODE_VERSION). يتطلب 18+${NC}"
        ((ERRORS++))
    fi
fi

# 2. فحص npm
command -v npm > /dev/null 2>&1
check "npm مثبت"

# 3. فحص ملفات المشروع
echo ""
echo -e "${BLUE}📁 فحص ملفات المشروع...${NC}"

[ -d "backend" ]
check "مجلد backend موجود"

[ -d "frontend" ]
check "مجلد frontend موجود"

[ -f "backend/package.json" ]
check "backend/package.json موجود"

[ -f "frontend/package.json" ]
check "frontend/package.json موجود"

[ -f "backend/src/server.js" ]
check "backend/src/server.js موجود"

# 4. فحص ملفات النشر
echo ""
echo -e "${BLUE}🚀 فحص ملفات النشر...${NC}"

[ -f "deploy-vps.sh" ]
check "deploy-vps.sh موجود"

[ -f "deploy-docker.sh" ]
check "deploy-docker.sh موجود"

[ -f "docker-compose.yml" ]
check "docker-compose.yml موجود"

[ -f "Dockerfile" ]
check "Dockerfile موجود"

[ -f "ecosystem.config.js" ]
check "ecosystem.config.js موجود"

[ -f "nginx.conf" ]
check "nginx.conf موجود"

# 5. فحص ملفات البيئة
echo ""
echo -e "${BLUE}⚙️  فحص ملفات البيئة...${NC}"

[ -f "backend/.env.example" ]
check "backend/.env.example موجود"

[ -f "backend/.env.production.example" ]
check "backend/.env.production.example موجود"

[ -f ".env.example" ]
check ".env.example موجود"

# 6. اختبار بناء Frontend
echo ""
echo -e "${BLUE}🔨 اختبار بناء Frontend...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⏳ تثبيت حزم Frontend...${NC}"
    npm install > /dev/null 2>&1
fi

npm run build > /dev/null 2>&1
check_warning "بناء Frontend ناجح"
cd ..

# 7. اختبار Backend
echo ""
echo -e "${BLUE}🔧 اختبار Backend...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⏳ تثبيت حزم Backend...${NC}"
    npm install > /dev/null 2>&1
fi

# فحص الملفات المطلوبة
[ -f "src/config/db.js" ]
check "db.js موجود"

[ -f "src/config/email.js" ]
check "email.js موجود"

[ -f "src/middleware/auth.js" ]
check "auth.js موجود"

cd ..

# 8. فحص Docker (اختياري)
echo ""
echo -e "${BLUE}🐳 فحص Docker (اختياري)...${NC}"
command -v docker > /dev/null 2>&1
check_warning "Docker مثبت"

command -v docker-compose > /dev/null 2>&1
check_warning "Docker Compose مثبت"

# النتيجة النهائية
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ المشروع جاهز للنشر!${NC}"
    echo ""
    echo -e "${BLUE}📝 الخطوات التالية:${NC}"
    echo "  1. للنشر باستخدام Docker:"
    echo "     chmod +x deploy-docker.sh && ./deploy-docker.sh"
    echo ""
    echo "  2. للنشر على VPS:"
    echo "     chmod +x deploy-vps.sh && ./deploy-vps.sh"
    echo ""
    echo "  3. للنشر اليدوي:"
    echo "     راجع ملف دليل_النشر.md"
else
    echo -e "${RED}❌ يوجد $ERRORS خطأ يجب إصلاحه قبل النشر${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  يوجد $WARNINGS تحذير (اختياري)${NC}"
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

exit $ERRORS
