const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getApiUrl: () => ipcRenderer.invoke('get-api-url'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    printToPDF: (filename) => ipcRenderer.invoke('print-to-pdf', filename),
    backupDB: () => ipcRenderer.invoke('backup-db'),
    
    // Auto-Updater hooks
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_event, info) => callback(info)),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_event, progressObj) => callback(progressObj)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_event, info) => callback(info)),
    installUpdate: () => ipcRenderer.send('install-update')
});
