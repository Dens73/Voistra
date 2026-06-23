import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

import { AuthView } from '../screens/AuthView';
import { AppWorkspaceShell } from '../components/AppWorkspaceShell';
import { ChannelAccessModal } from '../components/ChannelAccessModal';
import { ServerAccessModal } from '../components/ServerAccessModal';
import { WorkspaceContentRouter } from '../components/WorkspaceContentRouter';
import type {
  AuthUser,
  Channel,
  ConnectionMetrics,
  DirectConversation,
  DirectMessage,
  Friend,
  FriendRequest,
  Message,
  Server,
  ServerMember,
  VoiceParticipant,
} from '../types';
import type {
  AudioEnhancementMode,
  AuthMode,
  AvatarEditorState,
  ConnectedVoiceSession,
  FriendsPanelTab,
  Language,
  PeerDebugState,
  ProfilePanelTab,
  RemoteMedia,
  ServerPanelTab,
  VoiceFlags,
  WorkspaceMode,
} from './types';
import { COPY } from './app-copy';
import { AUDIO_MODE_KEY, LANGUAGE_KEY, REFRESH_KEY, TOKEN_KEY, USER_KEY } from './app-storage';
import { RemoteAudioSink, asMessage } from './app-ui';
import { useLocalAudioControls } from './audio/use-local-audio-controls';
import { useAppRuntimeEffects } from './use-app-runtime-effects';
import { useAppShellProps } from './use-app-shell-props';
import { useAppViewModel } from './use-app-view-model';
import { useAppNotifications } from './use-app-notifications';
import { useSessionActions } from './use-session-actions';
import { useWorkspaceData } from './use-workspace-data';
import { useVoiceRealtime } from './voice/use-voice-realtime';
import { api } from '../lib/api';
import { getRuntimeConfig } from '../lib/runtime-config';


export function AppShell() {
  const runtimeConfig = useMemo(() => getRuntimeConfig(), []);
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem(LANGUAGE_KEY) as Language) || 'ru');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [token, setToken] = useState<string>(() => localStorage.getItem(TOKEN_KEY) ?? '');
  const [refreshToken, setRefreshToken] = useState<string>(() => localStorage.getItem(REFRESH_KEY) ?? '');
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('servers');
  const [serverPanelTab, setServerPanelTab] = useState<ServerPanelTab>('overview');
  const [friendsPanelTab, setFriendsPanelTab] = useState<FriendsPanelTab>('requests');
  const [profilePanelTab, setProfilePanelTab] = useState<ProfilePanelTab>('account');
  const [selectedMemberActionUserId, setSelectedMemberActionUserId] = useState<string>('');
  const [avatarEditor, setAvatarEditor] = useState<AvatarEditorState>(null);
  const [serverDirectoryOpen, setServerDirectoryOpen] = useState<boolean>(false);
  const [channelPanelOpen, setChannelPanelOpen] = useState<boolean>(true);
  const [adminPanelOpen, setAdminPanelOpen] = useState<boolean>(false);
  const [serverModalOpen, setServerModalOpen] = useState<boolean>(false);
  const [servers, setServers] = useState<Server[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [userSearchResults, setUserSearchResults] = useState<AuthUser[]>([]);
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [directMessageDraft, setDirectMessageDraft] = useState<string>('');
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [connectedVoiceSession, setConnectedVoiceSession] = useState<ConnectedVoiceSession | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [selectedTextChannelId, setSelectedTextChannelId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [serverMembers, setServerMembers] = useState<ServerMember[]>([]);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [metrics, setMetrics] = useState<Record<string, ConnectionMetrics>>({});
  const [status, setStatus] = useState<string>(
    () => COPY[((localStorage.getItem(LANGUAGE_KEY) as Language) || 'ru')].appReady,
  );
  const [notificationCenterOpen, setNotificationCenterOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [version, setVersion] = useState<string>('');
  const [platform, setPlatform] = useState<string>('');
  const [voiceFlags, setVoiceFlags] = useState<VoiceFlags>({
    muted: false,
    deafened: false,
    pushToTalkActive: false,
    voiceActivationActive: true,
    speaking: false,
  });
  const [messageDraft, setMessageDraft] = useState<string>('');
  const [authForm, setAuthForm] = useState({
    username: '',
    displayName: '',
    password: '',
  });
  const [createServerForm, setCreateServerForm] = useState({ name: '', description: '' });
  const [serverSettingsForm, setServerSettingsForm] = useState({ name: '', description: '' });
  const [profileForm, setProfileForm] = useState({
    displayName: user?.displayName ?? '',
    avatarUrl: user?.avatarUrl ?? '',
    bio: user?.bio ?? '',
    currentPassword: '',
    newPassword: '',
    reconnectEnabled: user?.reconnectEnabled ?? true,
    pushToTalkEnabled: user?.pushToTalkEnabled ?? false,
    voiceActivationEnabled: user?.voiceActivationEnabled ?? true,
    noiseSuppressionEnabled: user?.noiseSuppressionEnabled ?? true,
    echoCancellationEnabled: user?.echoCancellationEnabled ?? true,
    autoGainControlEnabled: user?.autoGainControlEnabled ?? true,
  });
  const [joinServerForm, setJoinServerForm] = useState({ serverId: '' });
  const [createChannelForm, setCreateChannelForm] = useState({
    name: '',
    type: 'text' as 'text' | 'voice',
    isPrivate: false,
    password: '',
  });
  const [channelSettingsDrafts, setChannelSettingsDrafts] = useState<Record<string, { name: string; isPrivate: boolean; password: string }>>({});
  const [channelAccessForm, setChannelAccessForm] = useState({
    channelId: '',
    password: '',
  });
  const [unlockedChannelIds, setUnlockedChannelIds] = useState<string[]>([]);
  const [screenShareLabel, setScreenShareLabel] = useState<string>('');
  const [screenShareEnabled, setScreenShareEnabled] = useState<boolean>(false);
  const [shareSystemAudioEnabled, setShareSystemAudioEnabled] = useState<boolean>(false);
  const [activeScreenShares, setActiveScreenShares] = useState<Record<string, string>>({});
  const [remoteMedia, setRemoteMedia] = useState<Record<string, RemoteMedia>>({});
  const [remoteParticipantVolumes, setRemoteParticipantVolumes] = useState<Record<string, number>>({});
  const [remoteShareVolumes, setRemoteShareVolumes] = useState<Record<string, number>>({});
  const [audioPreferences, setAudioPreferences] = useState({
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    pushToTalkEnabled: false,
    voiceActivationEnabled: true,
  });
  const [audioControlForm, setAudioControlForm] = useState({
    inputLevel: 100,
    outputLevel: 100,
  });
  const [audioEnhancementMode, setAudioEnhancementMode] = useState<AudioEnhancementMode>(() => {
    if (typeof window === 'undefined') {
      return 'voice_focus';
    }
    const saved = window.localStorage.getItem(AUDIO_MODE_KEY);
    if (saved === 'voice_focus' || saved === 'balanced' || saved === 'studio') {
      return saved;
    }
    return 'voice_focus';
  });
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputDeviceId, setSelectedInputDeviceId] = useState<string>('default');
  const [selectedOutputDeviceId, setSelectedOutputDeviceId] = useState<string>('default');
  const [micTestLevel, setMicTestLevel] = useState<number>(0);
  const [micTestRunning, setMicTestRunning] = useState<boolean>(false);
  const [rtcConfig, setRtcConfig] = useState<RTCConfiguration>({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });
  const [networkTicker, setNetworkTicker] = useState<number>(0);
  const [peerDebug, setPeerDebug] = useState<Record<string, PeerDebugState>>({});

  const socketRef = useRef<Socket | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const mixedAudioContextRef = useRef<AudioContext | null>(null);
  const mixedAudioStreamRef = useRef<MediaStream | null>(null);
  const microphoneGainNodeRef = useRef<GainNode | null>(null);
  const screenShareStoppingRef = useRef(false);
  const micTestStreamRef = useRef<MediaStream | null>(null);
  const micTestAudioContextRef = useRef<AudioContext | null>(null);
  const micTestAnalyserRef = useRef<AnalyserNode | null>(null);
  const micTestAnimationFrameRef = useRef<number | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const makingOfferRef = useRef<Set<string>>(new Set());
  const ignoredOfferRef = useRef<Set<string>>(new Set());
  const activeVoiceChannelIdRef = useRef<string>('');
  const selectedConversationIdRef = useRef<string>('');
  const statsBytesRef = useRef<Map<string, { bytes: number; timestamp: number }>>(new Map());
  const participantSocketsRef = useRef<Map<string, string>>(new Map());
  const autoLoginAttemptedRef = useRef(false);

  const i18n = COPY[language];

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    if (token || user || autoLoginAttemptedRef.current) {
      return;
    }

    const username = runtimeConfig.autoLoginUsername?.trim();
    const password = runtimeConfig.autoLoginPassword?.trim();
    if (!username || !password) {
      return;
    }

    autoLoginAttemptedRef.current = true;
    setError('');
    setAuthMode('login');
    setAuthForm({
      username,
      displayName: '',
      password,
    });

    void api
      .login({ username, password })
      .then((response) => {
        setToken(response.accessToken);
        setRefreshToken(response.refreshToken);
        setUser(response.user);
        setStatus(`${COPY[language].authenticatedAs} ${response.user.displayName}`);
      })
      .catch((nextError) => {
        setError(asMessage(nextError));
      });
  }, [language, runtimeConfig, token, user]);

  const {
    activeShareEntries,
    avatarPreview,
    canCreateChannel,
    canManageServer,
    currentInputDeviceLabel,
    currentOutputDeviceLabel,
    currentServerMember,
    hasActiveModeration,
    linkedTextChannel,
    openAdminPanel,
    peerLabel,
    pendingLockedChannel,
    railActiveServerId,
    roleLabel,
    selectedChannel,
    selectedConversation,
    selectedManagedMember,
    selectedServer,
    shellUser,
    showChannelSidebar,
    textChannels,
    toggleAdminPanel,
    voiceChannels,
    yesNo,
  } = useAppViewModel({
    activeScreenShares,
    channelAccessForm,
    channelPanelOpen,
    channels,
    connectedVoiceSession,
    conversations,
    i18n,
    inputDevices,
    language,
    outputDevices,
    participants,
    profileForm,
    selectedChannelId,
    selectedConversationId,
    selectedInputDeviceId,
    selectedMemberActionUserId,
    selectedOutputDeviceId,
    selectedServerId,
    selectedTextChannelId,
    serverMembers,
    servers,
    unlockedChannelIds,
    user,
    workspaceMode,
    setAdminPanelOpen,
    setServerPanelTab,
  });
  const { clearNotifications, notifications, pushNotification, pushToast, toast } = useAppNotifications();
  const {
    handleAcceptFriendRequest,
    handleAuthSubmit,
    handleClearMemberRestrictions,
    handleCreateChannel,
    handleCreateServer,
    handleJoinServer,
    handleModerateMember,
    handleOpenConversation,
    handleRemoveFriend,
    handleRemoveMember,
    handleRemoveSpecificChannel,
    handleSearchUsers,
    handleSelectChannel,
    handleSendDirectMessage,
    handleSendFriendRequest,
    handleSendMessage,
    handleUnlockChannel,
    handleUpdateChannel,
    handleUpdateServer,
    loadChannels,
    loadConversations,
    loadDirectMessages,
    loadFriendRequests,
    loadFriends,
    loadMessages,
    loadServerMembers,
    loadServers,
    pollServerChannelNotifications,
  } = useWorkspaceData({
    authForm,
    authMode,
    canCreateChannel,
    canManageServer,
    channelAccessForm,
    channelSettingsDrafts,
    channels,
    createChannelForm,
    createServerForm,
    directMessageDraft,
    i18n,
    joinServerForm,
    language,
    linkedTextChannel,
    messageDraft,
    pushNotification,
    pushToast,
    selectedChannel,
    selectedChannelId,
    selectedConversationId,
    selectedServer,
    selectedServerId,
    selectedTextChannelId,
    serverSettingsForm,
    token,
    unlockedChannelIds,
    user,
    userSearchQuery,
    setAdminPanelOpen,
    setChannelAccessForm,
    setChannelPanelOpen,
    setChannelSettingsDrafts,
    setChannels,
    setConversations,
    setCreateChannelForm,
    setCreateServerForm,
    setDirectMessages,
    setDirectMessageDraft,
    setError,
    setFriendRequests,
    setFriends,
    setMessages,
    setMessageDraft,
    setRefreshToken,
    setSelectedChannelId,
    setSelectedConversationId,
    setSelectedMemberActionUserId,
    setSelectedServerId,
    setSelectedTextChannelId,
    setServerDirectoryOpen,
    setServerMembers,
    setServers,
    setStatus,
    setToken,
    setUnlockedChannelIds,
    setUser,
    setUserSearchResults,
    setWorkspaceMode,
  });
  const {
    applyAudioEnhancementMode,
    applyLocalAudioTrackState,
    refreshMediaDevices,
    stopMicTest,
    toggleMicrophoneTest,
  } = useLocalAudioControls({
    asMessage,
    audioControlForm,
    audioEnhancementMode,
    audioStreamRef,
    micTestAnalyserRef,
    micTestAnimationFrameRef,
    micTestAudioContextRef,
    micTestRunning,
    micTestStreamRef,
    selectedInputDeviceId,
    setAudioEnhancementMode,
    setError,
    setInputDevices,
    setMicTestLevel,
    setMicTestRunning,
    setOutputDevices,
    setProfileForm,
  });
  const {
    cleanupMixedAudio,
    closeAllPeers,
    emitVoiceState,
    handleRemoteDescription,
    handleRemoteIce,
    joinVoiceChannel,
    leaveVoiceChannel,
    publishConnectionMetrics,
    rebuildOutboundAudioStream,
    renegotiatePeers,
    startScreenShare,
    stopDisplayStreamTracks,
    stopScreenShare,
    syncPeerConnections,
    updatePeerDebug,
  } = useVoiceRealtime({
    activeVoiceChannelIdRef,
    applyLocalAudioTrackState,
    asMessage,
    audioControlForm,
    audioEnhancementMode,
    audioStreamRef,
    connectedVoiceSession,
    displayStreamRef,
    i18n,
    ignoredOfferRef,
    language,
    makingOfferRef,
    microphoneGainNodeRef,
    microphoneStreamRef,
    mixedAudioContextRef,
    mixedAudioStreamRef,
    participantSocketsRef,
    peerConnectionsRef,
    peerLabel,
    pendingIceRef,
    previewVideoRef,
    pushToast,
    rtcConfig,
    screenShareStoppingRef,
    selectedChannel,
    selectedInputDeviceId,
    selectedServerId,
    setActiveScreenShares,
    setConnectedVoiceSession,
    setError,
    setMetrics,
    setNetworkTicker,
    setParticipants,
    setPeerDebug,
    setRemoteMedia,
    setScreenShareEnabled,
    setScreenShareLabel,
    setStatus,
    setVoiceFlags,
    shareSystemAudioEnabled,
    socket,
    socketRef,
    statsBytesRef,
    userId: user?.id,
    voiceFlags,
  });
  const {
    applyAvatarEditor,
    handleAvatarFileChange,
    handleCopy,
    handleUpdateProfile,
    logout,
  } = useSessionActions({
    activeVoiceChannelIdRef,
    audioStreamRef,
    asMessage,
    avatarEditor,
    cleanupMixedAudio,
    closeAllPeers,
    displayStreamRef,
    i18n,
    language,
    localStorageKeys: {
      refreshToken: REFRESH_KEY,
      token: TOKEN_KEY,
      user: USER_KEY,
    },
    microphoneStreamRef,
    profileForm,
    pushToast,
    setActiveScreenShares,
    setAudioPreferences,
    setAvatarEditor,
    setChannels,
    setConnectedVoiceSession,
    setConversations,
    setDirectMessageDraft,
    setDirectMessages,
    setError,
    setFriendRequests,
    setFriends,
    setMessages,
    setMetrics,
    setParticipants,
    setPeerDebug,
    setProfileForm,
    setRefreshToken,
    setScreenShareEnabled,
    setScreenShareLabel,
    setSelectedChannelId,
    setSelectedConversationId,
    setSelectedServerId,
    setServers,
    setServerMembers,
    setStatus,
    setToken,
    setUser,
    setUserSearchResults,
    setVoiceFlags,
    setWorkspaceMode,
    socket,
    stopDisplayStreamTracks,
    token,
  });
  useAppRuntimeEffects({
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
    selectedConversationIdRef,
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
    statusError: error,
    stopMicTest,
    stopScreenShare,
    syncPeerConnections,
    token,
    unlockedChannelIds,
    updatePeerDebug,
    user,
    voiceFlags,
    workspaceMode,
    storageKeys: {
      accessToken: TOKEN_KEY,
      audioMode: AUDIO_MODE_KEY,
      language: LANGUAGE_KEY,
      refreshToken: REFRESH_KEY,
      user: USER_KEY,
    },
  });

  if (!user || !token) {
    return (
      <AuthView
        authMode={authMode}
        authForm={authForm}
        error={error}
        language={language}
        i18n={i18n}
        onAuthModeChange={setAuthMode}
        onAuthFormChange={(updater) => setAuthForm(updater)}
        onSubmit={handleAuthSubmit}
      />
    );
  }

  const { shellProps, workspaceContentProps } = useAppShellProps({
    workspaceContentProps: {
      activeScreenShares,
      adminPanelOpen,
      audioControlForm,
      audioEnhancementMode,
      avatarInputRef,
      avatarPreview,
      canCreateChannel,
      canManageServer,
      channelSettingsDrafts,
      channels,
      createChannelForm,
      currentInputDeviceLabel,
      currentOutputDeviceLabel,
      currentRoleLabel: roleLabel(selectedServer?.currentUserRole),
      directMessageDraft,
      directMessages,
      friendRequests,
      friends,
      i18n,
      inputDevices,
      language,
      messageDraft,
      messages,
      micTestLevel,
      micTestRunning,
      onlineUserIds,
      outputDevices,
      participants,
      previewVideoRef,
      profileForm,
      profilePanelTab,
      remoteMedia,
      remoteParticipantVolumes,
      remoteShareVolumes,
      screenShareEnabled,
      selectedChannel,
      selectedConversation,
      selectedInputDeviceId,
      selectedManagedMember,
      selectedMemberActionUserId,
      selectedOutputDeviceId,
      selectedServer,
      selectedServerId,
      serverMembers,
      serverPanelTab,
      serverSettingsForm,
      shareSystemAudioEnabled,
      textChannels,
      user,
      userSearchQuery,
      userSearchResults,
      voiceChannels,
      voiceFlags,
      workspaceMode,
      onAcceptFriendRequest: (requestId) => void handleAcceptFriendRequest(requestId),
      onAudioControlChange: setAudioControlForm,
      onAudioEnhancementModeChange: applyAudioEnhancementMode,
      onClearMemberRestrictions: (userId) => void handleClearMemberRestrictions(userId),
      onCloseAdminPanel: () => setAdminPanelOpen(false),
      onCopy: (value, label) => void handleCopy(value, label),
      onCreateChannel: handleCreateChannel,
      onCreateChannelFormChange: setCreateChannelForm,
      onDirectDraftChange: setDirectMessageDraft,
      onInputDeviceChange: setSelectedInputDeviceId,
      onJoinVoice: joinVoiceChannel,
      onLeaveVoice: leaveVoiceChannel,
      onMessageDraftChange: setMessageDraft,
      onModerateMember: (userId, action, durationMinutes) =>
        void handleModerateMember(userId, action, durationMinutes),
      onOpenAdminPanel: () => openAdminPanel('settings'),
      onOpenConversation: (userId) => void handleOpenConversation(userId),
      onOutputDeviceChange: setSelectedOutputDeviceId,
      onProfileFormChange: setProfileForm,
      onLogout: logout,
      onProfilePanelTabChange: setProfilePanelTab,
      onProfileSubmit: handleUpdateProfile,
      onRemoveChannel: (channelId) => void handleRemoveSpecificChannel(channelId),
      onRemoveFriend: (userId) => void handleRemoveFriend(userId),
      onRemoveMember: handleRemoveMember,
      onSearchQueryChange: setUserSearchQuery,
      onSearchUsers: handleSearchUsers,
      onSelectChannel: (channel) => void handleSelectChannel(channel),
      onSendDirectMessage: handleSendDirectMessage,
      onSendFriendRequest: (userId) => void handleSendFriendRequest(userId),
      onSendMessage: handleSendMessage,
      onServerSettingsFormChange: setServerSettingsForm,
      onSetChannelSettingsDrafts: setChannelSettingsDrafts,
      onSetMemberActionUserId: setSelectedMemberActionUserId,
      onSetRemoteParticipantVolume: setRemoteParticipantVolumes,
      onSetRemoteShareVolume: setRemoteShareVolumes,
      onSetServerPanelTab: setServerPanelTab,
      onSetShareSystemAudioEnabled: setShareSystemAudioEnabled,
      onStartScreenShare: () => void startScreenShare(),
      onStopScreenShare: stopScreenShare,
      onToggleDeafen: () => void emitVoiceState({ deafened: !voiceFlags.deafened }),
      onToggleMicrophoneTest: () => void toggleMicrophoneTest(),
      onToggleMute: () => void emitVoiceState({ muted: !voiceFlags.muted }),
      onToggleScreenShare: () => (screenShareEnabled ? stopScreenShare() : void startScreenShare()),
      onUpdateChannel: (channelId) => void handleUpdateChannel(channelId),
      onUpdateServer: handleUpdateServer,
    },
    shellProps: {
      adminPanelOpen,
      avatarInputRef,
      channelPanelOpen,
      connectedVoiceSession,
      conversationsCount: conversations.length,
      error,
      i18n,
      language,
      notifications,
      notificationCenterOpen,
      railActiveServerId,
      selectedChannel,
      selectedChannelId,
      selectedConversation,
      selectedServer,
      serverDirectoryOpen,
      servers,
      shellUser: shellUser!,
      showChannelSidebar,
      status,
      textChannels,
      toast,
      user,
      voiceChannels,
      voiceFlags,
      workspaceMode,
      onAvatarFileChange: (event) => void handleAvatarFileChange(event),
      onClearNotifications: clearNotifications,
      onCopy: (value, label) => void handleCopy(value, label),
      onLanguageChange: setLanguage,
      onOpenFriends: () => {
        setWorkspaceMode('friends');
        setChannelPanelOpen(false);
        setAdminPanelOpen(false);
      },
      onOpenProfile: () => {
        setWorkspaceMode('profile');
        setChannelPanelOpen(false);
        setAdminPanelOpen(false);
      },
      onOpenServerModal: () => setServerModalOpen(true),
      onSelectChannel: (channel) => void handleSelectChannel(channel),
      onSelectServer: (serverId) => {
        setWorkspaceMode('servers');
        setSelectedServerId(serverId);
        setAdminPanelOpen(false);
        setChannelPanelOpen(true);
      },
      onToggleAdminPanel: () => toggleAdminPanel('settings'),
      onToggleChannelPanel: () => setChannelPanelOpen((current) => !current),
      onToggleDeafen: () => emitVoiceState({ deafened: !voiceFlags.deafened }),
      onToggleMute: () => emitVoiceState({ muted: !voiceFlags.muted }),
      onToggleNotificationCenter: () => setNotificationCenterOpen((current) => !current),
      onToggleServerDirectory: (open) =>
        setServerDirectoryOpen((current) => (typeof open === 'boolean' ? open : !current)),
    },
  });

  const workspaceContent = (
    <WorkspaceContentRouter {...workspaceContentProps} />
  );

  return (
    <>
      <AppWorkspaceShell {...shellProps} workspaceContent={workspaceContent} />

      <RemoteAudioSink
        media={remoteMedia}
        muted={voiceFlags.deafened}
        outputDeviceId={selectedOutputDeviceId}
        outputLevel={audioControlForm.outputLevel}
        volumes={remoteParticipantVolumes}
      />

      <ChannelAccessModal
        open={Boolean(pendingLockedChannel)}
        channelName={pendingLockedChannel?.name ?? ''}
        language={language}
        password={channelAccessForm.password}
        onClose={() => setChannelAccessForm({ channelId: '', password: '' })}
        onPasswordChange={(value) => setChannelAccessForm((current) => ({ ...current, password: value }))}
        onSubmit={(event) => void handleUnlockChannel(event)}
      />

      <ServerAccessModal
        open={serverModalOpen}
        i18n={i18n}
        createServerForm={createServerForm}
        joinServerForm={joinServerForm}
        onClose={() => setServerModalOpen(false)}
        onCreateServerChange={setCreateServerForm}
        onCreateServerSubmit={(event) => void handleCreateServer(event)}
        onJoinServerChange={(value) => setJoinServerForm({ serverId: value })}
        onJoinServerSubmit={(event) => void handleJoinServer(event)}
      />
    </>
  );

}

