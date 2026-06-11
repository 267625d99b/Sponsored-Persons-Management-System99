@echo off
setlocal
cd /d "%~dp0"

echo ======================================================
echo    جاري تشغيل نظام إدارة المكفولين (نسخة سطح المكتب)
echo ======================================================
echo.

echo 1. جاري تنظيف العمليات السابقة المعلقة...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im electron.exe >nul 2>&1

echo.
echo 2. جاري التأكد من المكتبات (للمرة الأولى فقط)...
call npm install --no-audit --no-fund

echo.
echo 3. جاري تشغيل البرنامج...
echo (يرجى الانتظار حتى تظهر نافذة البرنامج تلقائياً)
call npm run electron:dev

if %ERRORLEVEL% neq 0 (
    echo.
    echo [خطأ] فشل تشغيل البرنامج. تأكد من تثبيت Node.js
    pause
)
