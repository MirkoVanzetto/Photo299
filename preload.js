// Photo299 - preload: espone un'API sicura al renderer
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  saveFile: (defaultName, filters, data) => ipcRenderer.invoke('save-file', { defaultName, filters, data }),
  saveFileTo: (filePath, data) => ipcRenderer.invoke('save-file-to', { filePath, data }),
  openFile: (filters) => ipcRenderer.invoke('open-file', { filters }),
  getPendingFile: () => ipcRenderer.invoke('get-pending-file'),
  onOpenFile: (cb) => ipcRenderer.on('open-file', (_e, f) => cb(f)),
  clipboardReadImage: () => ipcRenderer.invoke('clipboard-read-image'),
  clipboardWriteImage: (dataURL) => ipcRenderer.invoke('clipboard-write-image', dataURL),
  setTitle: (t) => ipcRenderer.send('set-title', t),
  toggleDevTools: () => ipcRenderer.send('toggle-devtools'),
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),
  quit: () => ipcRenderer.send('quit')
});
