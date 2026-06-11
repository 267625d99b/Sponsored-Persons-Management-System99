#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# سكريبت نشر تلقائي كامل على VPS
# ═══════════════════════════════════════════════════════════════

set -e

# الألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}       سكريبت نشر نظام إدارة المكفولين على VPS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# طلب المعلومات
read -p "أدخل IP السيرفر: " SERVER_IP
read -p "أدخل اسم النطاق (مثال: example.com): " DOMAIN
read -p "أدخل بريدك الإلكتروني للـ SSL: " EMAIL

echo ""
echo -e "${YELLOW}📝 المعلومات المدخلة:${NC}"
echo "  - IP السيرفر: $SERVER_IP"
echo "  - النطاق: $DOMAIN"
echo "  - البريد: $EMAIL"
echo ""
read -p "هل المعلومات صحيحة؟ (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo -e "${RED}تم الإلغاء${NC}"
    exit 1
fi

# توليد المفاتيح
echo ""
echo -e "${YELLOW}🔐 توليد المفاتيح الآمنة...${NC}"
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo -e "${GREEN}✅ تم توليد المفاتيح${NC}"

# حفظ المفاتيح في ملف
cat > .deployment-keys.txt << EOF
═══════════════════════════════════════════════════════════════
مفاتيح النشر - احتفظ بهذا الملف في مكان آمن!
═══════════════════════════════════════════════════════════════

JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY

تاريخ التوليد: $(date)
═══════════════════════════════════════════════════════════════
EOF

echo -e "${GREEN}✅ تم حفظ المفاتيح في .deployment-keys.txt${NC}"

# بناء Frontend
echo ""
echo -e "${YELLOW}📦 بناء Frontend...${NC}"
cd frontend
npm install
npm run build
cd ..
echo -e "${GREEN}✅ تم بناء Frontend${NC}"

# ضغط المشروع
echo ""
echo -e "${YELLOW}📦 ضغط الملفات...${NC}"
tar -czf project.tar.gz backend frontend ecosystem.config.js nginx.conf
echo -e "${GREEN}✅ تم ضغط الملفات${NC}"

# رفع للسيرفر
echo ""
echo -e "${YELLOW}📤 رفع الملفات للسيرفر...${NC}"
scp project.tar.gz root@$SERVER_IP:/tmp/
echo -e "${GREEN}✅ تم رفع الملفات${NC}"

# إعداد السيرفر
echo ""
echo -e "${YELLOW}⚙️  إعداد السيرفر...${NC}"

ssh root@$SERVER_IP << ENDSSH
set -e

echo "تحديث النظام..."
apt update && apt upgrade -y

echo "تثبيت Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

echo "تثبيت Nginx..."
apt install -y nginx

echo "تثبيت Certbot..."
apt install -y certbot python3-certbot-nginx

echo "تثبيت PM2..."
npm install -g pm2

echo "إنشاء المجلدات..."
mkdir -p /var/www
cd /var/www

echo "فك الضغط..."
tar -xzf /tmp/project.tar.gz
rm /tmp/project.tar.gz

echo "إعداد Backend..."
cd /var/www/backend
npm install --production

echo "إنشاء ملف .env..."
cat > .env << 'EOF'
PORT=5000
NODE_ENV=production
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=$ENCRYPTION_KEY
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CORS_ORIGIN=https://$DOMAIN
EOF

echo "إعداد Frontend..."
mkdir -p /var/www/html
cp -r /var/www/frontend/dist/* /var/www/html/

echo "إعداد Nginx..."
cat > /etc/nginx/sites-available/sponsorship << 'NGINXCONF'
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        root /var/www/html;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    client_max_body_size 10M;
}
NGINXCONF

ln -sf /etc/nginx/sites-available/sponsorship /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

echo "تشغيل Backend مع PM2..."
cd /var/www
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root

echo "إعداد Firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
echo "y" | ufw enable

echo "الحصول على SSL..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

echo "✅ تم إعداد السيرفر بنجاح!"

ENDSSH

# تنظيف
rm project.tar.gz

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}       ✅ تم النشر بنجاح!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📝 معلومات النشر:${NC}"
echo "  - الموقع: https://$DOMAIN"
echo "  - API: https://$DOMAIN/api"
echo ""
echo -e "${YELLOW}⚠️  الخطوات التالية:${NC}"
echo "  1. سجل دخول للموقع بالبيانات الافتراضية:"
echo "     - البريد: admin@example.com"
echo "     - كلمة المرور: Admin@123"
echo "  2. غيّر كلمة المرور فوراً!"
echo "  3. أضف بريدك الإلكتروني في ملف .env على السيرفر"
echo "  4. أعد تشغيل Backend: ssh root@$SERVER_IP 'cd /var/www && pm2 restart all'"
echo ""
echo -e "${BLUE}📊 مراقبة النظام:${NC}"
echo "  - عرض السجلات: ssh root@$SERVER_IP 'pm2 logs'"
echo "  - حالة PM2: ssh root@$SERVER_IP 'pm2 status'"
echo "  - إعادة التشغيل: ssh root@$SERVER_IP 'pm2 restart all'"
echo ""
echo -e "${RED}⚠️  مهم: احتفظ بملف .deployment-keys.txt في مكان آمن!${NC}"
echo ""
