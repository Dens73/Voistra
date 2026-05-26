import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desktopApi', {
  getVersion: () => ipcRenderer.invoke('app:get-version') as Promise<string>,
  getPlatform: () => ipcRenderer.invoke('app:get-platform') as Promise<string>,
});
