# ═══════════════════════════════════════════════════════════════
# Makefile لنظام إدارة المكفولين
# ═══════════════════════════════════════════════════════════════

.PHONY: help install dev build deploy clean

# الأمر الافتراضي
help:
	@echo "═══════════════════════════════════════════════════════════════"
	@echo "       نظام إدارة المكفولين - الأوامر المتاحة"
	@echo "═══════════════════════════════════════════════════════════════"
	@echo ""
	@echo "📦 التثبيت:"
	@echo "  make install          - تثبيت جميع الحزم"
	@echo ""
	@echo "🚀 التطوير:"
	@echo "  make dev              - تشغيل Backend + Frontend"
	@echo "  make dev-backend      - تشغيل Backend فقط"
	@echo "  make dev-frontend     - تشغيل Frontend فقط"
	@echo ""
	@echo "🔨 البناء:"
	@echo "  make build            - بناء Frontend"
	@echo ""
	@echo "🚢 النشر:"
	@echo "  make check            - فحص جاهزية النشر"
	@echo "  make deploy-docker    - نشر باستخدام Docker"
	@echo "  make deploy-vps       - نشر على VPS"
	@echo "  make update           - تحديث النشر"
	@echo ""
	@echo "🐳 Docker:"
	@echo "  make docker-up        - تشغيل الحاويات"
	@echo "  make docker-down      - إيقاف الحاويات"
	@echo "  make docker-logs      - عرض السجلات"
	@echo "  make docker-build     - بناء الصور"
	@echo ""
	@echo "🔧 أدوات:"
	@echo "  make keys             - توليد مفاتيح آمنة"
	@echo "  make clean            - تنظيف الملفات المؤقتة"
	@echo ""

# التثبيت
install:
	@echo "📦 تثبيت حزم Backend..."
	cd backend && npm install
	@echo "📦 تثبيت حزم Frontend..."
	cd frontend && npm install
	@echo "✅ تم التثبيت بنجاح!"

# التطوير
dev:
	@echo "🚀 تشغيل Backend + Frontend..."
	@echo "Backend: http://localhost:5000"
	@echo "Frontend: http://localhost:3000"
	@cd backend && npm run dev & cd frontend && npm run dev

dev-backend:
	@echo "🚀 تشغيل Backend..."
	cd backend && npm run dev

dev-frontend:
	@echo "🚀 تشغيل Frontend..."
	cd frontend && npm run dev

# البناء
build:
	@echo "🔨 بناء Frontend..."
	cd frontend && npm run build
	@echo "✅ تم البناء بنجاح!"

# النشر
check:
	@echo "🔍 فحص جاهزية النشر..."
	chmod +x check-deployment.sh
	./check-deployment.sh

deploy-docker:
	@echo "🐳 النشر باستخدام Docker..."
	chmod +x deploy-docker.sh
	./deploy-docker.sh

deploy-vps:
	@echo "🖥️  النشر على VPS..."
	chmod +x deploy-vps.sh
	./deploy-vps.sh

update:
	@echo "🔄 تحديث النشر..."
	chmod +x update-deployment.sh
	./update-deployment.sh

# Docker
docker-up:
	@echo "🐳 تشغيل الحاويات..."
	docker-compose up -d
	@echo "✅ الحاويات تعمل!"
	@echo "Frontend: http://localhost"
	@echo "Backend: http://localhost:5000"

docker-down:
	@echo "🛑 إيقاف الحاويات..."
	docker-compose down
	@echo "✅ تم إيقاف الحاويات"

docker-logs:
	@echo "📝 عرض السجلات..."
	docker-compose logs -f

docker-build:
	@echo "🔨 بناء صور Docker..."
	docker-compose build
	@echo "✅ تم بناء الصور"

# أدوات
keys:
	@echo "🔐 توليد مفاتيح آمنة..."
	@echo ""
	@node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'));"
	@echo ""
	@node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'));"
	@echo ""
	@echo "⚠️  احفظ هذه المفاتيح في مكان آمن!"

clean:
	@echo "🧹 تنظيف الملفات المؤقتة..."
	rm -rf backend/node_modules
	rm -rf frontend/node_modules
	rm -rf frontend/dist
	rm -rf backend/logs/*.log
	rm -f *.tar.gz
	@echo "✅ تم التنظيف"
