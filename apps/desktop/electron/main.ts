import { app, BrowserWindow, desktopCapturer, dialog, ipcMain, session } from 'electron';
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
let bundledServerProcess: ChildProcess | null = null;

type CliOptions = {
  profile?: string;
  serverOrigin?: string;
  apiUrl?: string;
  socketUrl?: string;
  autoLoginUsername?: string;
  autoLoginPassword?: string;
};

function parseCliOptions(argv: string[]): CliOptions {
  const options: CliOptions = {};

  for (const arg of argv) {
    if (!arg.startsWith('--')) {
      continue;
    }

    const [key, ...rest] = arg.slice(2).split('=');
    const value = rest.join('=').trim();
    if (!value) {
      continue;
    }

    switch (key) {
      case 'profile':
        options.profile = value;
        break;
      case 'server-origin':
        options.serverOrigin = value;
        break;
      case 'api-url':
        options.apiUrl = value;
        break;
      case 'socket-url':
        options.socketUrl = value;
        break;
      case 'auto-login-username':
        options.autoLoginUsername = value;
        break;
      case 'auto-login-password':
        options.autoLoginPassword = value;
        break;
      default:
        break;
    }
  }

  return options;
}

const cliOptions = parseCliOptions(process.argv.slice(1));
const profileSuffix = cliOptions.profile?.trim() || process.env.VOISTRA_PROFILE?.trim() || (isDev ? `instance-${process.pid}` : '');

type RuntimeConfig = {
  apiUrl: string;
  socketUrl: string;
  localApiUrl?: string;
  localSocketUrl?: string;
  mode: 'bundled' | 'remote';
  autoLoginUsername?: string;
  autoLoginPassword?: string;
};

type AuthBootstrapPayload = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    displayName: string;
  };
};

if (profileSuffix) {
  const baseUserDataPath = app.getPath('userData');
  app.setPath('userData', path.join(baseUserDataPath, profileSuffix));
}

function normalizeApiUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

function normalizeSocketUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/ws') ? trimmed : `${trimmed}/ws`;
}

function isLocalUrl(value: string) {
  try {
    const parsed = new URL(value);
    return ['127.0.0.1', 'localhost'].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn('[electron] failed to read config', filePath, error);
    return null;
  }
}

function loadRuntimeConfig(): RuntimeConfig {
  const defaultOrigin = 'http://127.0.0.1:3000';
  const userDataConfigPath = path.join(app.getPath('userData'), 'voistra.config.json');
  const processConfigPath = path.join(process.cwd(), 'voistra.config.json');
  const executableConfigPath = path.join(path.dirname(process.execPath), 'voistra.config.json');
  const resourcesConfigPath = path.join(process.resourcesPath, 'voistra.config.json');

  const fileConfig =
    readJsonFile<{
      serverOrigin?: string;
      apiUrl?: string;
      socketUrl?: string;
      localOrigin?: string;
      localApiUrl?: string;
      localSocketUrl?: string;
    }>(userDataConfigPath) ??
    readJsonFile<{
      serverOrigin?: string;
      apiUrl?: string;
      socketUrl?: string;
      localOrigin?: string;
      localApiUrl?: string;
      localSocketUrl?: string;
    }>(executableConfigPath) ??
    readJsonFile<{
      serverOrigin?: string;
      apiUrl?: string;
      socketUrl?: string;
      localOrigin?: string;
      localApiUrl?: string;
      localSocketUrl?: string;
    }>(resourcesConfigPath) ??
    readJsonFile<{
      serverOrigin?: string;
      apiUrl?: string;
      socketUrl?: string;
      localOrigin?: string;
      localApiUrl?: string;
      localSocketUrl?: string;
    }>(processConfigPath);

  const serverOrigin =
    cliOptions.serverOrigin?.trim() ||
    process.env.VOISTRA_SERVER_ORIGIN?.trim() ||
    fileConfig?.serverOrigin?.trim() ||
    defaultOrigin;
  const apiUrl = normalizeApiUrl(
    cliOptions.apiUrl?.trim() || process.env.VOISTRA_API_URL?.trim() || fileConfig?.apiUrl?.trim() || serverOrigin,
  );
  const socketUrl = normalizeSocketUrl(
    cliOptions.socketUrl?.trim() ||
      process.env.VOISTRA_SOCKET_URL?.trim() ||
      fileConfig?.socketUrl?.trim() ||
      serverOrigin,
  );
  const localOrigin =
    fileConfig?.localOrigin?.trim() ||
    (!isLocalUrl(serverOrigin) ? 'http://127.0.0.1:3001' : undefined);
  const localApiUrl = localOrigin
    ? normalizeApiUrl(fileConfig?.localApiUrl?.trim() || localOrigin)
    : undefined;
  const localSocketUrl = localOrigin
    ? normalizeSocketUrl(fileConfig?.localSocketUrl?.trim() || localOrigin)
    : undefined;

  return {
    apiUrl,
    socketUrl,
    localApiUrl,
    localSocketUrl,
    mode: isLocalUrl(apiUrl) ? 'bundled' : 'remote',
    autoLoginUsername: cliOptions.autoLoginUsername?.trim() || undefined,
    autoLoginPassword: cliOptions.autoLoginPassword?.trim() || undefined,
  };
}

async function fetchAuthBootstrapPayload(
  runtimeConfig: RuntimeConfig,
  username: string,
  password: string,
) {
  const endpoints = [
    { apiUrl: runtimeConfig.apiUrl, socketUrl: runtimeConfig.socketUrl },
    ...(runtimeConfig.localApiUrl && runtimeConfig.localSocketUrl
      ? [{ apiUrl: runtimeConfig.localApiUrl, socketUrl: runtimeConfig.localSocketUrl }]
      : []),
  ];

  let lastError: unknown;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${endpoint.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        lastError = new Error(`Auto-login failed with status ${response.status}`);
        continue;
      }

      const payload = (await response.json()) as AuthBootstrapPayload;
      return payload;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('Auto-login failed');
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

  const runtimeConfig = loadRuntimeConfig();
  if (runtimeConfig.mode === 'remote') {
    console.log('[electron] bundled backend disabled, using remote server', runtimeConfig.apiUrl);
    return;
  }

  const serverEntryCandidates = [
    path.join(process.resourcesPath, 'server', 'main.js'),
    path.join(__dirname, 'server', 'main.js'),
    path.join(__dirname, '..', 'server', 'main.js'),
  ];
  const serverEntry = serverEntryCandidates.find((candidate) => fs.existsSync(candidate));
  if (!serverEntry) {
    console.warn('[electron] bundled server entry not found', serverEntryCandidates);
    return;
  }

  const logDir = app.getPath('userData');
  fs.mkdirSync(logDir, { recursive: true });
  const stdout = fs.openSync(path.join(logDir, 'backend.log'), 'a');
  const stderr = fs.openSync(path.join(logDir, 'backend.err.log'), 'a');
  const relativeServerEntry = path.relative(process.resourcesPath, serverEntry);
  const serverEntryArg = relativeServerEntry.startsWith('..') ? serverEntry : relativeServerEntry;

  bundledServerProcess = spawn(process.execPath, [serverEntryArg], {
    cwd: process.resourcesPath,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      PORT: process.env.PORT ?? '3000',
      DB_TYPE: process.env.DB_TYPE ?? 'sqljs',
      DB_FILE: process.env.DB_FILE ?? path.join(app.getPath('userData'), 'voistra.sqlite'),
      REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
    },
    windowsHide: true,
    stdio: ['ignore', stdout, stderr],
  });
  bundledServerProcess.unref();
}

async function applyAutoLogin(window: BrowserWindow) {
  const runtimeConfig = loadRuntimeConfig();
  const username = runtimeConfig.autoLoginUsername?.trim();
  const password = runtimeConfig.autoLoginPassword?.trim();
  if (!username || !password || window.isDestroyed()) {
    return;
  }

  try {
    const alreadyAuthenticated = await window.webContents.executeJavaScript(
      `(() => {
        try {
          const token = localStorage.getItem('diploma_voip_access_token');
          const rawUser = localStorage.getItem('diploma_voip_user');
          if (!token || !rawUser) {
            return false;
          }
          const user = JSON.parse(rawUser);
          return user?.username === ${JSON.stringify(username)};
        } catch {
          return false;
        }
      })()`,
      true,
    );

    if (alreadyAuthenticated) {
      return;
    }

    const payload = await fetchAuthBootstrapPayload(runtimeConfig, username, password);

    await window.webContents.executeJavaScript(
      `(() => {
        localStorage.setItem('diploma_voip_access_token', ${JSON.stringify(payload.accessToken)});
        localStorage.setItem('diploma_voip_refresh_token', ${JSON.stringify(payload.refreshToken)});
        localStorage.setItem('diploma_voip_user', ${JSON.stringify(JSON.stringify(payload.user))});
      })()`,
      true,
    );

    if (!window.isDestroyed()) {
      window.webContents.reload();
    }
  } catch (error) {
    console.error('[electron] auto-login bootstrap failed', error);
  }
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
    void applyAutoLogin(window);
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

app.whenReady().then(async () => {
  startBundledServer();
  ipcMain.handle('app:get-version', () => app.getVersion());
  ipcMain.handle('app:get-platform', () => process.platform);
  ipcMain.on('app:get-runtime-config', (event) => {
    event.returnValue = loadRuntimeConfig();
  });

  try {
    await session.defaultSession.setProxy({ mode: 'direct' });
    console.log('[electron] proxy mode set to direct');
  } catch (error) {
    console.warn('[electron] failed to set direct proxy mode', error);
  }

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
