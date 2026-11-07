// Photo299 - processo principale Electron
const { app, BrowserWindow, ipcMain, dialog, clipboard, nativeImage, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let win = null;
let pendingOpenFile = null;

function findFileArg(argv) {
  return argv.slice(1).find(a => /\.(p299|png|jpe?g|webp|gif|bmp)$/i.test(a) && fs.existsSync(a)) || null;
}

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 880,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#1b1c1f',
    title: 'Photo299',
    icon: path.join(__dirname, 'build', 'icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}

// Istanza singola: se si apre un file con l'app già aperta, lo passa alla finestra esistente
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_e, argv) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
      const f = findFileArg(argv);
      if (f) win.webContents.send('open-file', readFileForRenderer(f));
    }
  });
  pendingOpenFile = findFileArg(process.argv);
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => app.quit());
}

function readFileForRenderer(p) {
  const buf = fs.readFileSync(p);
  return { name: path.basename(p), path: p, base64: buf.toString('base64') };
}

ipcMain.handle('get-pending-file', () => {
  if (!pendingOpenFile) return null;
  const f = pendingOpenFile; pendingOpenFile = null;
  try { return readFileForRenderer(f); } catch { return null; }
});

ipcMain.handle('save-file', async (_e, { defaultName, filters, data }) => {
  const res = await dialog.showSaveDialog(win, { defaultPath: defaultName, filters });
  if (res.canceled || !res.filePath) return { canceled: true };
  fs.writeFileSync(res.filePath, Buffer.from(data));
  return { canceled: false, path: res.filePath };
});

ipcMain.handle('save-file-to', async (_e, { filePath, data }) => {
  fs.writeFileSync(filePath, Buffer.from(data));
  return { path: filePath };
});

ipcMain.handle('open-file', async (_e, { filters }) => {
  const res = await dialog.showOpenDialog(win, { properties: ['openFile'], filters });
  if (res.canceled || !res.filePaths.length) return null;
  return readFileForRenderer(res.filePaths[0]);
});

ipcMain.handle('clipboard-read-image', () => {
  const img = clipboard.readImage();
  if (img.isEmpty()) return null;
  return img.toDataURL();
});

ipcMain.handle('clipboard-write-image', (_e, dataURL) => {
  clipboard.writeImage(nativeImage.createFromDataURL(dataURL));
  return true;
});

ipcMain.on('set-title', (_e, title) => { if (win) win.setTitle(title); });
ipcMain.on('toggle-devtools', () => { if (win) win.webContents.toggleDevTools(); });
ipcMain.on('toggle-fullscreen', () => { if (win) win.setFullScreen(!win.isFullScreen()); });
ipcMain.on('quit', () => app.quit());
