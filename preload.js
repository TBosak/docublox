const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message) => ipcRenderer.send('message', message),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
});
