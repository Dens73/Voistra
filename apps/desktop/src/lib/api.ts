import type {
  AuthResponse,
  Channel,
  DirectConversation,
  DirectMessage,
  Friend,
  FriendRequest,
  Message,
  Server,
  ServerMember,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3000/api';

type RequestOptions = {
  token?: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  _retry?: boolean;
};

type SessionConfig = {
  accessToken?: string;
  refreshToken?: string;
  onTokens?: ((accessToken: string, refreshToken: string) => void) | null;
  onUnauthorized?: (() => void) | null;
};

const session = {
  accessToken: '',
  refreshToken: '',
  onTokens: null as SessionConfig['onTokens'],
  onUnauthorized: null as SessionConfig['onUnauthorized'],
  refreshPromise: null as Promise<string> | null,
};

const RETRYABLE_METHODS = new Set(['GET', 'POST', 'PATCH', 'DELETE']);
const SERVER_BOOT_RETRY_DELAYS = [250, 350, 500, 700, 900, 1200, 1500];

function sleep(delayMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

async function fetchWithServerBootRetry(input: string, init: RequestInit) {
  let lastError: unknown;
  const method = (init.method ?? 'GET').toUpperCase();
  const delays = RETRYABLE_METHODS.has(method) ? SERVER_BOOT_RETRY_DELAYS : [];

  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      return await fetch(input, init);
    } catch (error) {
      lastError = error;
      if (attempt === delays.length) {
        break;
      }

      await sleep(delays[attempt]);
    }
  }

  throw lastError ?? new Error('Failed to fetch');
}

export function configureApiSession(config: SessionConfig) {
  session.accessToken = config.accessToken ?? '';
  session.refreshToken = config.refreshToken ?? '';
  session.onTokens = config.onTokens ?? null;
  session.onUnauthorized = config.onUnauthorized ?? null;
}

function parseErrorMessage(payload: string, status: number) {
  const text = payload.trim();
  if (!text) {
    return `Request failed with ${status}`;
  }

  try {
    const parsed = JSON.parse(text) as { message?: string | string[]; error?: string };
    if (Array.isArray(parsed.message)) {
      return parsed.message.join(', ');
    }
    if (typeof parsed.message === 'string') {
      return parsed.message;
    }
    if (typeof parsed.error === 'string') {
      return parsed.error;
    }
  } catch {
    return text;
  }

  return text;
}

async function refreshAccessToken() {
  if (!session.refreshToken) {
    throw new Error('Unauthorized');
  }

  if (!session.refreshPromise) {
    session.refreshPromise = (async () => {
      const response = await fetchWithServerBootRetry(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Unauthorized');
      }

      const payload = (await response.json()) as AuthResponse;
      session.accessToken = payload.accessToken;
      session.refreshToken = payload.refreshToken;
      session.onTokens?.(payload.accessToken, payload.refreshToken);
      return payload.accessToken;
    })().finally(() => {
      session.refreshPromise = null;
    });
  }

  return session.refreshPromise;
}

async function request<T>(path: string, options: RequestOptions = {}) {
  let response: Response;
  const authToken = options.token ?? session.accessToken;

  try {
    response = await fetchWithServerBootRetry(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error('Failed to fetch');
  }

  if (response.status === 401 && authToken && session.refreshToken && !options._retry) {
    try {
      const nextAccessToken = await refreshAccessToken();
      return request<T>(path, { ...options, token: nextAccessToken, _retry: true });
    } catch {
      session.onUnauthorized?.();
      throw new Error('Unauthorized');
    }
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(parseErrorMessage(error, response.status));
  }

  return (await response.json()) as T;
}

export const api = {
  register(payload: { username: string; displayName: string; password: string }) {
    return request<AuthResponse>('/auth/register', { method: 'POST', body: payload });
  },
  login(payload: { username: string; password: string }) {
    return request<AuthResponse>('/auth/login', { method: 'POST', body: payload });
  },
  me(token: string) {
    return request<AuthResponse['user']>('/auth/me', { token });
  },
  updateProfile(token: string, payload: Record<string, unknown>) {
    return request<AuthResponse['user']>('/users/me', { method: 'PATCH', token, body: payload });
  },
  searchUsers(token: string, query: string) {
    return request<AuthResponse['user'][]>(`/users/search?q=${encodeURIComponent(query)}`, { token });
  },
  getServers(token: string) {
    return request<Server[]>('/servers', { token });
  },
  createServer(token: string, payload: { name: string; description?: string }) {
    return request<Server>('/servers', { method: 'POST', token, body: payload });
  },
  joinServer(token: string, serverId: string) {
    return request<Server>(`/servers/${serverId}/join`, { method: 'POST', token });
  },
  getChannels(token: string, serverId: string) {
    return request<Channel[]>(`/servers/${serverId}/channels`, { token });
  },
  getServerMembers(token: string, serverId: string) {
    return request<ServerMember[]>(`/servers/${serverId}/members`, { token });
  },
  updateServer(token: string, serverId: string, payload: { name?: string; description?: string | null }) {
    return request<Server>(`/servers/${serverId}`, { method: 'PATCH', token, body: payload });
  },
  removeServerMember(token: string, serverId: string, memberUserId: string) {
    return request<{ ok: boolean }>(`/servers/${serverId}/members/${memberUserId}`, {
      method: 'DELETE',
      token,
    });
  },
  moderateServerMember(
    token: string,
    serverId: string,
    memberUserId: string,
    payload: {
      action:
        | 'mute'
        | 'deafen'
        | 'block_share'
        | 'ban'
        | 'clear_mute'
        | 'clear_deafen'
        | 'clear_block_share'
        | 'clear_ban';
      durationMinutes?: number;
    },
  ) {
    return request<{ ok: boolean }>(`/servers/${serverId}/members/${memberUserId}/moderation`, {
      method: 'PATCH',
      token,
      body: payload,
    });
  },
  createChannel(
    token: string,
    serverId: string,
    payload: { name: string; type: 'text' | 'voice'; isPrivate?: boolean; password?: string },
  ) {
    return request<Channel>(`/servers/${serverId}/channels`, { method: 'POST', token, body: payload });
  },
  updateChannel(
    token: string,
    serverId: string,
    channelId: string,
    payload: { name?: string; isPrivate?: boolean; password?: string },
  ) {
    return request<Channel>(`/servers/${serverId}/channels/${channelId}`, { method: 'PATCH', token, body: payload });
  },
  accessChannel(token: string, serverId: string, channelId: string, password?: string) {
    return request<{ ok: boolean }>(`/servers/${serverId}/channels/${channelId}/access`, {
      method: 'POST',
      token,
      body: { password },
    });
  },
  removeChannel(token: string, serverId: string, channelId: string) {
    return request<{ ok: boolean }>(`/servers/${serverId}/channels/${channelId}`, {
      method: 'DELETE',
      token,
    });
  },
  getMessages(token: string, serverId: string, channelId: string) {
    return request<Message[]>(`/servers/${serverId}/channels/${channelId}/messages`, { token });
  },
  sendMessage(token: string, serverId: string, channelId: string, content: string) {
    return request<Message>(`/servers/${serverId}/channels/${channelId}/messages`, {
      method: 'POST',
      token,
      body: { content },
    });
  },
  getFriends(token: string) {
    return request<Friend[]>('/social/friends', { token });
  },
  getFriendRequests(token: string) {
    return request<FriendRequest[]>('/social/requests', { token });
  },
  sendFriendRequest(token: string, target: string) {
    return request<{ id: string; status: string }>('/social/requests', {
      method: 'POST',
      token,
      body: { target },
    });
  },
  acceptFriendRequest(token: string, requestId: string) {
    return request<FriendRequest>(`/social/requests/${requestId}/accept`, {
      method: 'POST',
      token,
    });
  },
  removeFriend(token: string, friendUserId: string) {
    return request<{ ok: boolean }>(`/social/friends/${friendUserId}`, {
      method: 'DELETE',
      token,
    });
  },
  getDirectConversations(token: string) {
    return request<DirectConversation[]>('/social/conversations', { token });
  },
  ensureDirectConversation(token: string, otherUserId: string) {
    return request<DirectConversation>(`/social/conversations/by-user/${otherUserId}`, {
      method: 'POST',
      token,
    });
  },
  getDirectMessages(token: string, conversationId: string) {
    return request<DirectMessage[]>(`/social/conversations/${conversationId}/messages`, { token });
  },
  sendDirectMessage(token: string, conversationId: string, content: string) {
    return request<DirectMessage>(`/social/conversations/${conversationId}/messages`, {
      method: 'POST',
      token,
      body: { content },
    });
  },
};
