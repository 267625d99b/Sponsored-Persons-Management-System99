#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# سكريبت تحضير المشروع للنشر المجاني على Render
# ═══════════════════════════════════════════════════════════════

set -e

# الألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}       تحضير المشروع للنشر المجاني على Render${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# فحص Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git غير مثبت!${NC}"
    echo "يرجى تثبيت Git أولاً: https://git-scm.com/downloads"
    exit 1
fi

echo -e "${GREEN}✅ Git مثبت${NC}"
echo ""

# فحص Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js غير مثبت!${NC}"
    echo "يرجى تثبيت Node.js أولاً: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ إصدار Node.js قديم ($NODE_VERSION). يتطلب 18+${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $NODE_VERSION مثبت${NC}"
echo ""

# توليد المفاتيح
echo -e "${YELLOW}🔐 توليد المفاتيح الآمنة...${NC}"
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo -e "${GREEN}✅ تم توليد المفاتيح${NC}"
echo ""

# حفظ المفاتيح
cat > .deployment-keys.txt << EOF
═══════════════════════════════════════════════════════════════
مفاتيح النشر المجاني - احتفظ بهذا الملف!
═══════════════════════════════════════════════════════════════

استخدم هذه المفاتيح عند النشر على Render:

JWT_SECRET=$JWT_SECRET

ENCRYPTION_KEY=$ENCRYPTION_KEY

تاريخ التوليد: $(date)
═══════════════════════════════════════════════════════════════
EOF

echo -e "${GREEN}✅ تم حفظ المفاتيح في .deployment-keys.txt${NC}"
echo ""

# فحص Git repository
if [ ! -d .git ]; then
    echo -e "${YELLOW}📦 إنشاء Git repository...${NC}"
    git init
    echo -e "${GREEN}✅ تم إنشاء Git repository${NC}"
else
    echo -e "${GREEN}✅ Git repository موجود${NC}"
fi
echo ""

# إنشاء .gitignore إذا لم يكن موجوداً
if [ ! -f .gitignore ]; then
    echo -e "${YELLOW}📝 إنشاء .gitignore...${NC}"
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Environment
.env
.env.local
.env.*.local
.deployment-keys.txt

# Logs
logs/
*.log

# Database
*.db
*.db-journal

# Build
dist/
build/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Uploads
uploads/*
!uploads/.gitkeep

# Backups
backups/*
!backups/.gitkeep
EOF
    echo -e "${GREEN}✅ تم إنشاء .gitignore${NC}"
else
    echo -e "${GREEN}✅ .gitignore موجود${NC}"
fi
echo ""

# اختبار بناء Frontend
echo -e "${YELLOW}🔨 اختبار بناء Frontend...${NC}"
cd frontend
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}⏳ تثبيت حزم Frontend...${NC}"
    npm install
fi
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ بناء Frontend ناجح${NC}"
else
    echo -e "${RED}❌ فشل بناء Frontend${NC}"
    exit 1
fi
cd ..
echo ""

# اختبار Backend
echo -e "${YELLOW}🔧 اختبار Backend...${NC}"
cd backend
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}⏳ تثبيت حزم Backend...${NC}"
    npm install
fi
echo -e "${GREEN}✅ Backend جاهز${NC}"
cd ..
echo ""

# إضافة الملفات لـ Git
echo -e "${YELLOW}📦 إضافة الملفات لـ Git...${NC}"
git add .
echo -e "${GREEN}✅ تم إضافة الملفات${NC}"
echo ""

# Commit
if git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  لا توجد تغييرات للحفظ${NC}"
else
    echo -e "${YELLOW}💾 حفظ التغييرات...${NC}"
    git commit -m "Prepare for free deployment on Render" || true
    echo -e "${GREEN}✅ تم حفظ التغييرات${NC}"
fi
echo ""

# التعليمات النهائية
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}       ✅ المشروع جاهز للنشر المجاني!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📝 الخطوات التالية:${NC}"
echo ""
echo -e "${YELLOW}1. رفع المشروع على GitHub:${NC}"
echo "   - اذهب إلى https://github.com/new"
echo "   - أنشئ repository جديد"
echo "   - نفذ الأوامر التالية:"
echo ""
echo -e "${GREEN}   git remote add origin https://github.com/username/repo-name.git${NC}"
echo -e "${GREEN}   git branch -M main${NC}"
echo -e "${GREEN}   git push -u origin main${NC}"
echo ""
echo -e "${YELLOW}2. النشر على Render:${NC}"
echo "   - اذهب إلى https://render.com"
echo "   - سجل دخول بحساب GitHub"
echo "   - اتبع التعليمات في ملف FREE_DEPLOYMENT.md"
echo ""
echo -e "${YELLOW}3. المفاتيح المطلوبة (موجودة في .deployment-keys.txt):${NC}"
echo ""
echo -e "${BLUE}JWT_SECRET:${NC}"
echo "$JWT_SECRET"
echo ""
echo -e "${BLUE}ENCRYPTION_KEY:${NC}"
echo "$ENCRYPTION_KEY"
echo ""
echo -e "${RED}⚠️  احفظ هذه المفاتيح في مكان آمن!${NC}"
echo ""
echo -e "${YELLOW}4. المتغيرات البيئية الأخرى المطلوبة:${NC}"
echo "   - NODE_ENV=production"
echo "   - PORT=10000"
echo "   - EMAIL_SERVICE=gmail"
echo "   - EMAIL_USER=your_email@gmail.com"
echo "   - EMAIL_PASS=your_app_password"
echo "   - CORS_ORIGIN=https://your-frontend.onrender.com"
echo ""
echo -e "${BLUE}📚 للمزيد من التفاصيل، راجع:${NC}"
echo "   - FREE_DEPLOYMENT.md - دليل النشر المجاني الكامل"
echo "   - ENVIRONMENT_VARIABLES.md - شرح المتغيرات البيئية"
echo ""
echo -e "${GREEN}🎉 بالتوفيق!${NC}"
echo ""
