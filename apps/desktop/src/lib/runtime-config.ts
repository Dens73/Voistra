type DesktopRuntimeConfig = {
  apiUrl: string;
  socketUrl: string;
  localApiUrl?: string;
  localSocketUrl?: string;
  mode: 'bundled' | 'remote';
  autoLoginUsername?: string;
  autoLoginPassword?: string;
};

const DEFAULT_CONFIG: DesktopRuntimeConfig = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3000/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? 'http://127.0.0.1:3000/ws',
  mode: 'bundled',
};

const baseRuntimeConfig: DesktopRuntimeConfig = window.desktopApi?.getRuntimeConfig?.() ?? DEFAULT_CONFIG;
let activeRuntimeConfig: DesktopRuntimeConfig = { ...baseRuntimeConfig };
let localFallbackResolved = false;

export function getRuntimeConfig() {
  return activeRuntimeConfig;
}

export function getApiUrl() {
  return activeRuntimeConfig.apiUrl;
}

export function getSocketUrl() {
  return activeRuntimeConfig.socketUrl;
}

export function isUsingLocalRuntimeFallback() {
  return Boolean(
    activeRuntimeConfig.localApiUrl &&
      activeRuntimeConfig.apiUrl === activeRuntimeConfig.localApiUrl &&
      activeRuntimeConfig.localSocketUrl &&
      activeRuntimeConfig.socketUrl === activeRuntimeConfig.localSocketUrl,
  );
}

export async function activateLocalRuntimeFallback() {
  if (isUsingLocalRuntimeFallback()) {
    return true;
  }

  if (!baseRuntimeConfig.localApiUrl || !baseRuntimeConfig.localSocketUrl) {
    return false;
  }

  if (localFallbackResolved) {
    return false;
  }

  localFallbackResolved = true;

  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 1500);
    const response = await fetch(`${baseRuntimeConfig.localApiUrl}/health`, {
      signal: controller.signal,
    });
    window.clearTimeout(timeoutId);

    if (!response.ok) {
      return false;
    }

    activeRuntimeConfig = {
      ...baseRuntimeConfig,
      apiUrl: baseRuntimeConfig.localApiUrl,
      socketUrl: baseRuntimeConfig.localSocketUrl,
      mode: 'bundled',
    };
    return true;
  } catch {
    return false;
  }
}
