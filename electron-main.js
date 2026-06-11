const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let backendProcess;

function checkBackend(url, timeout = 30000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const tryConnect = () => {
      if (Date.now() - startTime > timeout) {
        resolve(false);
        return;
      }

      http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          setTimeout(tryConnect, 1000);
        }
      }).on('error', () => {
        setTimeout(tryConnect, 1000);
      });
    };

    tryConnect();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, 'frontend/public/الشعار.png'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // إخفاء الـ menu bar نهائياً
  Menu.setApplicationMenu(null);

  // في حالة التطوير، نفتح المنفذ 3000 (Vite)
  // في حالة الإنتاج، نفتح ملف index.html
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'frontend/dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  const isDev = !app.isPackaged;
  const backendPath = path.join(__dirname, 'backend/src/server.js');
  
  // استخدام مسار بيانات المستخدم في حالة الإنتاج لضمان الحفظ الدائم
  const userDataPath = app.getPath('userData');
  const dataPath = isDev ? __dirname : userDataPath;

  backendProcess = spawn('node', [backendPath], {
    env: { 
      ...process.env, 
      PORT: 5000, 
      NODE_ENV: isDev ? 'development' : 'production',
      ELECTRON_DATA_PATH: dataPath,
      JWT_SECRET: process.env.JWT_SECRET || 'desktop-secret-key-123',
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'desktop-encryption-key-123'
    },
    stdio: 'inherit'
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend process:', err);
  });
}

app.on('ready', () => {
  const isDev = !app.isPackaged;
  
  if (!isDev) {
    // في نسخة البرنامج النهائية فقط، نقوم بتشغيل الباكيند من هنا
    startBackend();
  }
  
  // ننتظر حتى يعمل السيرفر باستخدام كود داخلي بدلاً من مكتبة خارجية
  checkBackend('http://localhost:5000/api/health').then((success) => {
    if (!success) {
      console.error('Backend failed to start or was not found within timeout');
    }
    createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
