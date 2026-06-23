import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';

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
  getUpdateStatus: () => ipcRenderer.invoke('updates:get-status'),
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
  installUpdate: () => ipcRenderer.invoke('updates:install'),
  onUpdateStatus: (callback: (status: unknown) => void) => {
    const listener = (_event: IpcRendererEvent, status: unknown) => callback(status);
    ipcRenderer.on('updates:status', listener);
    return () => ipcRenderer.removeListener('updates:status', listener);
  },
});
