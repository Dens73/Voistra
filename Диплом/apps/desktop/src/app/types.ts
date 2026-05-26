import type { AuthUser, Channel, ConnectionMetrics } from '../types';

export type AuthMode = 'login' | 'register';
export type Language = 'ru' | 'en';
export type WorkspaceMode = 'servers' | 'friends' | 'profile';
export type ServerPanelTab = 'overview' | 'members' | 'settings';
export type FriendsPanelTab = 'requests' | 'conversations';
export type ProfilePanelTab = 'account' | 'security' | 'audio';

export type VoiceFlags = {
  muted: boolean;
  deafened: boolean;
  pushToTalkActive: boolean;
  voiceActivationActive: boolean;
  speaking: boolean;
};

export type AudioEnhancementMode = 'voice_focus' | 'balanced' | 'studio';

export type AvatarEditorState = {
  source: string;
  scale: number;
  offsetX: number;
  offsetY: number;
} | null;

export type RemoteMedia = {
  userId: string;
  audioStream?: MediaStream;
  screenStream?: MediaStream;
};

export type SignalingDescription = {
  channelId: string;
  fromUserId: string;
  description: RTCSessionDescriptionInit;
};

export type SignalingIce = {
  channelId: string;
  fromUserId: string;
  candidate: RTCIceCandidateInit;
};

export type PeerDebugState = {
  remoteUserId: string;
  signalingState: RTCPeerConnectionState | RTCSignalingState | string;
  iceConnectionState: RTCIceConnectionState | string;
  connectionState: RTCPeerConnectionState | string;
  localDescriptionType: string;
  remoteDescriptionType: string;
  localAudioTrack: boolean;
  localVideoTrack: boolean;
  remoteAudioTrack: boolean;
  remoteVideoTrack: boolean;
  offersSent: number;
  answersSent: number;
  iceSent: number;
  iceReceived: number;
  pendingIce: number;
  lastEvent: string;
  updatedAt: string;
};

export type ConnectedVoiceSession = {
  channelId: string;
  channelName: string;
  serverId: string;
};

export type ActionIconKind =
  | 'plus'
  | 'link'
  | 'save'
  | 'join'
  | 'leave'
  | 'remove'
  | 'mute'
  | 'ear'
  | 'talk'
  | 'spark'
  | 'pulse'
  | 'screen'
  | 'stop'
  | 'logout'
  | 'more'
  | 'close'
  | 'copy'
  | 'message'
  | 'bell'
  | 'menu'
  | 'panel'
  | 'settings';

export type AccessBadgeProps = {
  isPrivate: boolean;
  language: Language;
};

export type UserIdentityProps = {
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  subtitle?: string;
  compact?: boolean;
};

export type RemoteMediaViewProps = {
  label: string;
  audioStream?: MediaStream;
  screenStream?: MediaStream;
  muted: boolean;
  volume: number;
  shareLevel: number;
  shareVolume: number;
  outputDeviceId: string;
  language: Language;
  onShareVolumeChange: (value: number) => void;
};

export type ChannelGlyphProps = {
  type: Channel['type'];
};

export type ProfileAvatarProps = {
  user: AuthUser | null;
};

export type UserAvatarPreviewProps = {
  displayName: string;
  avatarUrl?: string | null;
};

export type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export type ToggleRowProps = ToggleSwitchProps & {
  label: string;
};

export type MetricsSummaryKey = keyof Omit<ConnectionMetrics, 'updatedAt'>;
