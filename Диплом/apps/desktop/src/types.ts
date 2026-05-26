export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  reconnectEnabled: boolean;
  pushToTalkEnabled: boolean;
  voiceActivationEnabled: boolean;
  noiseSuppressionEnabled?: boolean;
  echoCancellationEnabled?: boolean;
  autoGainControlEnabled?: boolean;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type ChannelType = 'text' | 'voice';

export type Channel = {
  id: string;
  name: string;
  type: ChannelType;
  isPrivate: boolean;
  createdAt: string;
};

export type Server = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  owner: {
    id: string;
    username: string;
    displayName: string;
  } | null;
  currentUserRole: string;
  memberCount: number;
  channels: Channel[];
  createdAt: string;
  updatedAt?: string;
};

export type ServerMember = {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  isOwner: boolean;
  moderation?: {
    bannedUntil?: string | null;
    mutedUntil?: string | null;
    deafenedUntil?: string | null;
    screenShareBlockedUntil?: string | null;
    isBanned: boolean;
    isMuted: boolean;
    isDeafened: boolean;
    isScreenShareBlocked: boolean;
  };
  user: {
    id: string;
    username: string;
    displayName: string;
  } | null;
};

export type Message = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
  } | null;
};

export type Friend = AuthUser & {
  connectedAt: string;
};

export type FriendRequest = {
  id: string;
  direction: 'incoming' | 'outgoing';
  status: 'pending' | 'accepted';
  createdAt: string;
  requester: AuthUser;
  recipient: AuthUser;
};

export type DirectConversation = {
  id: string;
  createdAt: string;
  updatedAt: string;
  participant: AuthUser | null;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    author: AuthUser | null;
  } | null;
};

export type DirectMessage = {
  id: string;
  content: string;
  createdAt: string;
  author: AuthUser | null;
};

export type VoiceParticipant = {
  socketId?: string;
  userId: string;
  username: string;
  muted: boolean;
  deafened: boolean;
  speaking: boolean;
  pushToTalkActive: boolean;
  voiceActivationActive: boolean;
};

export type ConnectionMetrics = {
  rtt?: number;
  jitter?: number;
  packetLoss?: number;
  bitrate?: number;
  updatedAt: string;
};

declare global {
  interface Window {
    desktopApi: {
      getVersion: () => Promise<string>;
      getPlatform: () => Promise<string>;
    };
  }
}
