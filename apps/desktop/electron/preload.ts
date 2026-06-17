import { contextBridge, ipcRenderer } from 'electron';

const runtimeConfig = ipcRenderer.sendSync('app:get-runtime-config') as {
  apiUrl: string;
  socketUrl: string;
  localApiUrl?: string;
  localSocketUrl?: string;
  mode: 'bundled' | 'remote';
  autoLoginUsername?: string;
  autoLoginPassword?: string;
};

contextBridge.exposeInMainWorld('desktopApi', {
  getVersion: () => ipcRenderer.invoke('app:get-version') as Promise<string>,
  getPlatform: () => ipcRenderer.invoke('app:get-platform') as Promise<string>,
  getRuntimeConfig: () => runtimeConfig,
});
