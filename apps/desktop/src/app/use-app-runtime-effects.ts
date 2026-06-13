import { useEffect } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Socket } from 'socket.io-client';

import type {
  AuthUser,
  Channel,
  ConnectionMetrics,
  DirectConversation,
  Friend,
  FriendRequest,
  Server,
  ServerMember,
  VoiceParticipant,
} from '../types';
import type {
  AudioEnhancementMode,
  ConnectedVoiceSession,
  PeerDebugState,
  SignalingDescription,
  SignalingIce,
  VoiceFlags,
  WorkspaceMode,
} from './types';
import { useNotificationEffects } from './runtime/use-notification-effects';
import { useRealtimeSocketEffect } from './runtime/use-realtime-socket-effect';
import { useSessionSyncEffects } from './runtime/use-session-sync-effects';
import { useWorkspaceLoadingEffects } from './runtime/use-workspace-loading-effects';

type RuntimeCopy = {
  browser: string;
  realtimeConnected: string;
  realtimeDisconnected: string;
  screenShare: string;
  turnReady: string;
  unknown: string;
  unknownUser: string;
};

type ProfileForm = {
  displayName: string;
  avatarUrl: string;
  bio: string;
  currentPassword: string;
  newPassword: string;
  reconnectEnabled: boolean;
  pushToTalkEnabled: boolean;
  voiceActivationEnabled: boolean;
  noiseSuppressionEnabled: boolean;
  echoCancellationEnabled: boolean;
  autoGainControlEnabled: boolean;
};

type UseAppRuntimeEffectsParams = {
  applyLocalAudioTrackState: (nextFlags: VoiceFlags) => void;
  audioControlForm: { inputLevel: number };
  audioEnhancementMode: AudioEnhancementMode;
  canCreateChannel: boolean;
  channels: Channel[];
  connectedVoiceSession: ConnectedVoiceSession | null;
  conversations: DirectConversation[];
  currentServerMember: ServerMember | null;
  displayStreamRef: MutableRefObject<MediaStream | null>;
  emitVoiceState: (nextState: Partial<VoiceFlags>) => void;
  friendRequests: FriendRequest[];
  friends: Friend[];
  handleRemoteDescription: (payload: SignalingDescription) => Promise<void>;
  handleRemoteIce: (payload: SignalingIce) => Promise<void>;
  i18n: RuntimeCopy;
  inputDevices: MediaDeviceInfo[];
  language: 'ru' | 'en';
  leaveVoiceChannel: () => void;
  linkedTextChannel: Channel | null;
  loadChannels: (token: string, serverId: string) => Promise<void>;
  loadConversations: (token: string) => Promise<void>;
  loadDirectMessages: (token: string, conversationId: string) => Promise<void>;
  loadFriendRequests: (token: string) => Promise<void>;
  loadFriends: (token: string) => Promise<void>;
  loadMessages: (token: string, serverId: string, channelId: string) => Promise<void>;
  loadServerMembers: (token: string, serverId: string) => Promise<void>;
  loadServers: (token: string) => Promise<void>;
  microphoneStreamRef: MutableRefObject<MediaStream | null>;
  outputDevices: MediaDeviceInfo[];
  participants: VoiceParticipant[];
  participantSocketsRef: MutableRefObject<Map<string, string>>;
  peerLabel: (userId: string) => string;
  pollServerChannelNotifications: (token: string, serverId: string) => Promise<void>;
  previewVideoRef: MutableRefObject<HTMLVideoElement | null>;
  profileForm: ProfileForm;
  publishConnectionMetrics: (channelId: string) => Promise<void>;
  pushNotification: (title: string, body: string, tone?: 'soft' | 'alert') => void;
  rebuildOutboundAudioStream: () => Promise<void>;
  refreshMediaDevices: () => Promise<void>;
  refreshToken: string;
  renegotiatePeers: () => Promise<void>;
  screenShareEnabled: boolean;
  shareSystemAudioEnabled: boolean;
  selectedChannel: Channel | null;
  selectedConversationId: string;
  selectedInputDeviceId: string;
  selectedOutputDeviceId: string;
  selectedServer: Server | null;
  selectedServerId: string;
  selectedTextChannelId: string;
  serverMembers: ServerMember[];
  setActiveScreenShares: Dispatch<SetStateAction<Record<string, string>>>;
  setAudioEnhancementMode: Dispatch<SetStateAction<AudioEnhancementMode>>;
  setAudioPreferences: Dispatch<
    SetStateAction<{
      noiseSuppression: boolean;
      echoCancellation: boolean;
      autoGainControl: boolean;
      pushToTalkEnabled: boolean;
      voiceActivationEnabled: boolean;
    }>
  >;
  setChannelSettingsDrafts: Dispatch<SetStateAction<Record<string, { name: string; isPrivate: boolean; password: string }>>>;
  setChannels: Dispatch<SetStateAction<Channel[]>>;
  setDirectMessages: Dispatch<SetStateAction<import('../types').DirectMessage[]>>;
  setError: Dispatch<SetStateAction<string>>;
  setMessages: Dispatch<SetStateAction<import('../types').Message[]>>;
  setMetrics: Dispatch<SetStateAction<Record<string, ConnectionMetrics>>>;
  setOnlineUserIds: Dispatch<SetStateAction<string[]>>;
  setParticipants: Dispatch<SetStateAction<VoiceParticipant[]>>;
  setPlatform: Dispatch<SetStateAction<string>>;
  setProfileForm: Dispatch<SetStateAction<ProfileForm>>;
  setRefreshToken: Dispatch<SetStateAction<string>>;
  setRtcConfig: Dispatch<SetStateAction<RTCConfiguration>>;
  setSelectedChannelId: Dispatch<SetStateAction<string>>;
  setSelectedInputDeviceId: Dispatch<SetStateAction<string>>;
  setSelectedOutputDeviceId: Dispatch<SetStateAction<string>>;
  setSelectedTextChannelId: Dispatch<SetStateAction<string>>;
  setServerMembers: Dispatch<SetStateAction<ServerMember[]>>;
  setServerSettingsForm: Dispatch<SetStateAction<{ name: string; description: string }>>;
  setSocket: Dispatch<SetStateAction<Socket | null>>;
  setStatus: Dispatch<SetStateAction<string>>;
  setToken: Dispatch<SetStateAction<string>>;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
  setVersion: Dispatch<SetStateAction<string>>;
  setVoiceFlags: Dispatch<SetStateAction<VoiceFlags>>;
  socket: Socket | null;
  socketRef: MutableRefObject<Socket | null>;
  statusError: string;
  stopMicTest: () => void;
  stopScreenShare: () => void;
  syncPeerConnections: (list: VoiceParticipant[]) => void;
  token: string;
  unlockedChannelIds: string[];
  updatePeerDebug: (remoteUserId: string, updater: (current: PeerDebugState) => PeerDebugState) => void;
  user: AuthUser | null;
  voiceFlags: VoiceFlags;
  workspaceMode: WorkspaceMode;
  storageKeys: {
    accessToken: string;
    audioMode: string;
    language: string;
    refreshToken: string;
    user: string;
  };
};

export function useAppRuntimeEffects({
  applyLocalAudioTrackState,
  audioControlForm,
  audioEnhancementMode,
  canCreateChannel,
  channels,
  connectedVoiceSession,
  conversations,
  currentServerMember,
  displayStreamRef,
  emitVoiceState,
  friendRequests,
  friends,
  handleRemoteDescription,
  handleRemoteIce,
  i18n,
  inputDevices,
  language,
  leaveVoiceChannel,
  linkedTextChannel,
  loadChannels,
  loadConversations,
  loadDirectMessages,
  loadFriendRequests,
  loadFriends,
  loadMessages,
  loadServerMembers,
  loadServers,
  microphoneStreamRef,
  outputDevices,
  participants,
  participantSocketsRef,
  peerLabel,
  pollServerChannelNotifications,
  previewVideoRef,
  profileForm,
  publishConnectionMetrics,
  pushNotification,
  rebuildOutboundAudioStream,
  refreshMediaDevices,
  refreshToken,
  renegotiatePeers,
  screenShareEnabled,
  shareSystemAudioEnabled,
  selectedChannel,
  selectedConversationId,
  selectedInputDeviceId,
  selectedOutputDeviceId,
  selectedServer,
  selectedServerId,
  selectedTextChannelId,
  serverMembers,
  setActiveScreenShares,
  setAudioEnhancementMode,
  setAudioPreferences,
  setChannelSettingsDrafts,
  setChannels,
  setDirectMessages,
  setError,
  setMessages,
  setMetrics,
  setOnlineUserIds,
  setParticipants,
  setPlatform,
  setProfileForm,
  setRefreshToken,
  setRtcConfig,
  setSelectedChannelId,
  setSelectedInputDeviceId,
  setSelectedOutputDeviceId,
  setSelectedTextChannelId,
  setServerMembers,
  setServerSettingsForm,
  setSocket,
  setStatus,
  setToken,
  setUser,
  setVersion,
  setVoiceFlags,
  socket,
  socketRef,
  statusError,
  stopMicTest,
  stopScreenShare,
  syncPeerConnections,
  token,
  unlockedChannelIds,
  updatePeerDebug,
  user,
  voiceFlags,
  workspaceMode,
  storageKeys,
}: UseAppRuntimeEffectsParams) {
  useEffect(() => {
    if (workspaceMode !== 'servers' && statusError) {
      setError('');
    }
  }, [statusError, workspaceMode, setError]);

  useSessionSyncEffects({
    audioEnhancementMode,
    channels,
    i18n,
    inputDevices,
    language,
    outputDevices,
    profileForm,
    refreshToken,
    selectedInputDeviceId,
    selectedOutputDeviceId,
    selectedServer,
    setAudioEnhancementMode,
    setAudioPreferences,
    setChannelSettingsDrafts,
    setPlatform,
    setProfileForm,
    setRefreshToken,
    setSelectedInputDeviceId,
    setSelectedOutputDeviceId,
    setToken,
    setUser,
    setVersion,
    storageKeys,
    token,
    user,
  });

  useRealtimeSocketEffect({
    handleRemoteDescription,
    handleRemoteIce,
    i18n,
    language,
    participantSocketsRef,
    peerLabel,
    pushNotification,
    setActiveScreenShares,
    setMetrics,
    setOnlineUserIds,
    setParticipants,
    setRtcConfig,
    setSocket,
    setStatus,
    socket,
    socketRef,
    syncPeerConnections,
    token,
    updatePeerDebug,
    user,
  });

  useNotificationEffects({
    connectedVoiceSession,
    conversations,
    currentServerMember,
    friendRequests,
    friends,
    i18n,
    language,
    participants,
    peerLabel,
    pushNotification,
    userId: user?.id,
  });

  useWorkspaceLoadingEffects({
    applyLocalAudioTrackState,
    audioControlForm,
    audioEnhancementMode,
    canCreateChannel,
    channels,
    displayStreamRef,
    i18n,
    language,
    linkedTextChannel,
    loadChannels,
    loadConversations,
    loadDirectMessages,
    loadFriendRequests,
    loadFriends,
    loadMessages,
    loadServerMembers,
    loadServers,
    microphoneStreamRef,
    pollServerChannelNotifications,
    previewVideoRef,
    publishConnectionMetrics,
    rebuildOutboundAudioStream,
    refreshMediaDevices,
    renegotiatePeers,
    screenShareEnabled,
    selectedChannel,
    selectedConversationId,
    selectedInputDeviceId,
    selectedServer,
    selectedServerId,
    selectedTextChannelId,
    setChannels,
    setDirectMessages,
    setError,
    setMessages,
    setSelectedChannelId,
    setSelectedTextChannelId,
    setServerMembers,
    setServerSettingsForm,
    setVoiceFlags,
    shareSystemAudioEnabled,
    socketConnected: Boolean(socket),
    stopMicTest,
    token,
    unlockedChannelIds,
    userId: user?.id,
    voiceFlags,
  });

  useEffect(() => {
    const selfParticipant = participants.find((participant) => participant.userId === user?.id);
    if (!selfParticipant) {
      return;
    }

    setVoiceFlags((current) => {
      const next = {
        ...current,
        muted: selfParticipant.muted,
        deafened: selfParticipant.deafened,
        speaking: selfParticipant.speaking,
        pushToTalkActive: selfParticipant.pushToTalkActive,
        voiceActivationActive: selfParticipant.voiceActivationActive,
      };
      applyLocalAudioTrackState(next);
      return next;
    });
  }, [participants, user?.id, applyLocalAudioTrackState, setVoiceFlags]);

  useEffect(() => {
    if (!connectedVoiceSession || !currentServerMember?.moderation) {
      return;
    }

    if (currentServerMember.moderation.isBanned && connectedVoiceSession.serverId === selectedServerId) {
      leaveVoiceChannel();
      setError(language === 'ru' ? 'Вы временно заблокированы на сервере.' : 'You are temporarily banned from this server.');
      return;
    }

    if (currentServerMember.moderation.isScreenShareBlocked && screenShareEnabled) {
      stopScreenShare();
    }

    const nextState: Partial<VoiceFlags> = {};
    if (currentServerMember.moderation.isMuted && !voiceFlags.muted) {
      nextState.muted = true;
    }
    if (currentServerMember.moderation.isDeafened && !voiceFlags.deafened) {
      nextState.deafened = true;
    }

    if (Object.keys(nextState).length > 0) {
      emitVoiceState(nextState);
    }
  }, [
    connectedVoiceSession,
    currentServerMember,
    emitVoiceState,
    language,
    leaveVoiceChannel,
    screenShareEnabled,
    selectedServerId,
    setError,
    stopScreenShare,
    voiceFlags.deafened,
    voiceFlags.muted,
  ]);
}
