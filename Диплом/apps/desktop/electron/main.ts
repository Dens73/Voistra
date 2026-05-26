import { app, BrowserWindow, desktopCapturer, dialog, ipcMain, session } from 'electron';
import { fork, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
const profileSuffix = process.env.VOISTRA_PROFILE?.trim() || (isDev ? `instance-${process.pid}` : '');
let bundledServerProcess: ChildProcess | null = null;

if (profileSuffix) {
  const baseUserDataPath = app.getPath('userData');
  app.setPath('userData', path.join(baseUserDataPath, profileSuffix));
}

async function pickDisplaySource(parent: BrowserWindow | null) {
  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    fetchWindowIcons: true,
    thumbnailSize: {
      width: 320,
      height: 180,
    },
  });

  if (sources.length === 0) {
    return null;
  }

  const options = {
    type: 'question' as const,
    buttons: [...sources.map((source, index) => `${index + 1}. ${source.name}`), 'Cancel'],
    cancelId: sources.length,
    defaultId: 0,
    noLink: true,
    title: 'Choose what to share',
    message: 'Select a screen or window for Voistra',
    detail: 'Your selected source will be published to the current voice channel.',
  };

  const { response } = parent ? await dialog.showMessageBox(parent, options) : await dialog.showMessageBox(options);

  if (response < 0 || response >= sources.length) {
    return null;
  }

  return sources[response];
}

function startBundledServer() {
  if (isDev || bundledServerProcess) {
    return;
  }

  const serverEntry = path.join(process.resourcesPath, 'server', 'main.js');
  if (!fs.existsSync(serverEntry)) {
    console.warn('[electron] bundled server entry not found', serverEntry);
    return;
  }

  bundledServerProcess = fork(serverEntry, [], {
    env: {
      ...process.env,
      PORT: process.env.PORT ?? '3000',
    },
    stdio: 'ignore',
  });
  bundledServerProcess.unref();
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: '#0b1020',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.webContents.on('did-start-loading', () => {
    console.log('[electron] did-start-loading');
  });

  window.webContents.on('did-finish-load', () => {
    console.log('[electron] did-finish-load');
  });

  window.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    console.error('[electron] did-fail-load', {
      errorCode,
      errorDescription,
      validatedURL,
      isMainFrame,
    });
  });

  window.webContents.on('render-process-gone', (_event, details) => {
    console.error('[electron] render-process-gone', details);
  });

  window.webContents.on('unresponsive', () => {
    console.error('[electron] window-unresponsive');
  });

  if (isDev) {
    window.loadURL(process.env.VITE_DEV_SERVER_URL as string);
    if (process.env.VOISTRA_OPEN_DEVTOOLS === '1') {
      window.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    window.loadFile(path.join(__dirname, '..', 'dist-renderer', 'index.html'));
  }
}

app.whenReady().then(() => {
  startBundledServer();
  ipcMain.handle('app:get-version', () => app.getVersion());
  ipcMain.handle('app:get-platform', () => process.platform);
  session.defaultSession.setDisplayMediaRequestHandler(
    (_request, callback) => {
      void pickDisplaySource(BrowserWindow.getFocusedWindow()).then((source) => {
        if (!source) {
          callback({});
          return;
        }

        callback({
          video: source,
          audio: process.platform === 'win32' ? 'loopback' : undefined,
        });
      });
    },
    { useSystemPicker: true },
  );

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (bundledServerProcess && !bundledServerProcess.killed) {
    bundledServerProcess.kill();
  }
});
