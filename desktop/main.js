const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const { autoUpdater } = require('electron-updater');
const electronLog = require('electron-log');

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit();
}

// Silence noisy Chromium console warnings automatically in development
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

let mainWindow;
let djangoProcess;
let djangoPort = 8000;
let isDev = !app.isPackaged;

// Helper: Setup User Data Directory
const userDataPath = path.join(app.getPath('userData'), 'JewelloSoft_Data');
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}
const logPath = path.join(userDataPath, 'logs');
if (!fs.existsSync(logPath)) {
  fs.mkdirSync(logPath, { recursive: true });
}

const electronLogFile = path.join(logPath, 'electron.log');
function log(msg) {
  const ts = new Date().toISOString();
  fs.appendFileSync(electronLogFile, `[${ts}] ${msg}\n`);
  console.log(msg);
}

// Helper: Find an open port
function findOpenPort(startPort) {
  return new Promise((resolve, reject) => {
    const server = require('net').createServer();
    server.listen(startPort, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(findOpenPort(startPort + 1));
      } else {
        reject(err);
      }
    });
  });
}

// Helper: Wait for Django /api/health/ endpoints
function waitForBackend(port, retries = 30) {
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(`http://127.0.0.1:${port}/api/health/`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
      }).on('error', retry);
    };
    
    const retry = () => {
      if (retries <= 0) {
        reject(new Error("Backend timeout"));
        return;
      }
      retries--;
      setTimeout(check, 1000);
    };
    
    check();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    show: false, // Don't show immediately to prevent white screen
    icon: isDev
      ? path.join(__dirname, '../frontend/src/assets/icons/b503ee48-1ece-4256-8ef5-72c1d9f0a8de.png')
      : path.join(__dirname, 'build/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.removeMenu(); // Remove default file menu

  const indexPath = isDev 
    ? path.join(__dirname, '../frontend/dist/index.html') 
    : path.join(process.resourcesPath, 'frontend/index.html');

  mainWindow.loadFile(indexPath);

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startDjango() {
  log(`Starting backend. Environment: ${isDev ? 'DEV' : 'PROD'}`);
  return findOpenPort(8000).then(port => {
    djangoPort = port;
    log(`Selected Django Port: ${djangoPort}`);
    
    const backendPath = isDev 
      ? path.join(__dirname, '../backend/dist/backend.exe')
      : path.join(process.resourcesPath, 'backend.exe');

    // FAIL-SAFE: Startup validation
    if (!fs.existsSync(backendPath)) {
      log(`BACKEND NOT FOUND AT: ${backendPath}`);
      dialog.showErrorBox(
        "Startup Error",
        "Backend service missing. Please reinstall the application or build the backend executable."
      );
      app.quit();
      return Promise.reject(new Error("Backend missing"));
    }

    // OS environments for Django dynamic routing
    const env = { 
      ...process.env, 
      'JEWELLOSOFT_DESKTOP': '1',
      'JEWELLOSOFT_DATA_PATH': userDataPath
    };

    log(`Starting backend from: ${backendPath}`);

    djangoProcess = spawn(backendPath, [djangoPort.toString()], {
      cwd: path.dirname(backendPath),
      windowsHide: true,
      env: env
    });

    djangoProcess.stdout.on('data', (data) => {
      log(`Backend: ${data}`);
    });

    djangoProcess.stderr.on('data', (data) => {
      log(`Backend Error: ${data}`);
    });

    djangoProcess.on('error', (err) => {
      log(`Failed to start backend: ${err}`);
    });

    djangoProcess.on('close', (code) => {
      log(`Backend exited with code ${code}`);
      if (mainWindow) {
        mainWindow.loadFile(path.join(__dirname, 'crash.html'));
        mainWindow.show();
      }
    });

    return waitForBackend(djangoPort);
  });
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('ready', async () => {
  try {
    // Attempt backend start, then show UI
    await startDjango();
    createWindow();

    // ─── Electron-level CSP override (production-safe) ───────────
    // This guarantees the CSP is correct even if the HTML meta tag
    // is stale from a cached build. It only adds Supabase to
    // connect-src; all other directives remain locked down.
    const { session } = require('electron');
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const csp = [
        "default-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com https://cdnjs.cloudflare.com",
        "script-src 'self' 'unsafe-inline'",
        "connect-src 'self' http://127.0.0.1:* ws://localhost:* https://*.supabase.co",
        "img-src 'self' data: https: http://127.0.0.1:*",
        "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com"
      ].join('; ');

      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [csp]
        }
      });
    });

    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  } catch (err) {
    log(`Fatal Error starting app: ${err.message}`);
    const errWindow = new BrowserWindow({ width: 600, height: 400 });
    errWindow.loadFile(path.join(__dirname, 'crash.html'));
    errWindow.show();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Graceful shutdown of child process
  if (djangoProcess) {
    killProcessTree(djangoProcess.pid);
  }
});

// Windows specific tree killer for child processes
function killProcessTree(pid) {
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', pid, '/f', '/t']);
  } else {
    process.kill(-pid, 'SIGKILL');
  }
}

// ─────────────────────────────────────────────────────────────────
// Auto Updater Configurations & Handlers
// ─────────────────────────────────────────────────────────────────

electronLog.transports.file.resolvePathFn = () => path.join(userDataPath, 'logs', 'electron-updater.log');
autoUpdater.logger = electronLog;
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = true; // explicitly enable auto-download

autoUpdater.on('update-available', (info) => {
  electronLog.info('Update available.');
  if (mainWindow) mainWindow.webContents.send('update-available', info);
});

autoUpdater.on('download-progress', (progressObj) => {
  if (mainWindow) mainWindow.webContents.send('download-progress', progressObj);
});

autoUpdater.on('update-downloaded', (info) => {
  electronLog.info('Update downloaded.');
  if (mainWindow) mainWindow.webContents.send('update-downloaded', info);
});

autoUpdater.on('error', (err) => {
  electronLog.error(`AutoUpdater Error: ${err.message}`);
  // Optionally, we could send an 'update-error' implicitly, but best to keep it silent for now
});

ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall();
});

// ─────────────────────────────────────────────────────────────────
// IPC API Handlers
// ─────────────────────────────────────────────────────────────────

ipcMain.handle('get-api-url', () => {
  return `http://127.0.0.1:${djangoPort}/api`;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// PDF Generation using native electron webContents
ipcMain.handle('print-to-pdf', async (event, filename) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    const pdfData = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    const defaultPath = path.join(app.getPath('documents'), filename || 'Invoice.pdf');
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Save PDF',
      defaultPath: defaultPath,
      filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
    });

    if (!canceled && filePath) {
      fs.writeFileSync(filePath, pdfData);
      shell.openPath(filePath); // Auto open
      return { success: true, path: filePath };
    }
    return { success: false, reason: 'canceled' };
  } catch (error) {
    log(`PDF Print Error: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// Backup System Setup (Offline-Friendly Feature)
ipcMain.handle('backup-db', async (event) => {
    try {
        const sourcePath = path.join(userDataPath, 'db.sqlite3');
        const defaultPath = path.join(app.getPath('downloads'), `JewelloSoft_Backup_${Date.now()}.sqlite3`);
        
        const win = BrowserWindow.fromWebContents(event.sender);
        const { canceled, filePath } = await dialog.showSaveDialog(win, {
            title: 'Export Database Backup',
            defaultPath: defaultPath,
            filters: [{ name: 'SQLite Database', extensions: ['sqlite3'] }]
        });

        if (!canceled && filePath) {
            fs.copyFileSync(sourcePath, filePath);
            return { success: true, path: filePath };
        }
        return { success: false, reason: 'canceled' };
    } catch (error) {
        log(`Backup Error: ${error.message}`);
        return { success: false, error: error.message };
    }
});
