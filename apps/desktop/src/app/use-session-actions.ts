import type { ChangeEvent, Dispatch, FormEvent, MutableRefObject, SetStateAction } from 'react';

import { api } from '../lib/api';
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
  AppNotification,
  AvatarEditorState,
  ConnectedVoiceSession,
  PeerDebugState,
  RemoteMedia,
  VoiceFlags,
  WorkspaceMode,
} from './types';

type SessionCopy = {
  appReady: string;
  copied: string;
  profileSettings: string;
};

type UseSessionActionsParams = {
  activeVoiceChannelIdRef: MutableRefObject<string>;
  audioStreamRef: MutableRefObject<MediaStream | null>;
  asMessage: (value: unknown) => string;
  avatarEditor: AvatarEditorState;
  cleanupMixedAudio: () => void;
  closeAllPeers: () => void;
  displayStreamRef: MutableRefObject<MediaStream | null>;
  i18n: SessionCopy;
  language: 'ru' | 'en';
  localStorageKeys: {
    refreshToken: string;
    token: string;
    user: string;
  };
  microphoneStreamRef: MutableRefObject<MediaStream | null>;
  profileForm: {
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
  pushToast: (message: string) => void;
  setActiveScreenShares: Dispatch<SetStateAction<Record<string, string>>>;
  setAvatarEditor: Dispatch<SetStateAction<AvatarEditorState>>;
  setAudioPreferences: Dispatch<
    SetStateAction<{
      noiseSuppression: boolean;
      echoCancellation: boolean;
      autoGainControl: boolean;
      pushToTalkEnabled: boolean;
      voiceActivationEnabled: boolean;
    }>
  >;
  setChannels: Dispatch<SetStateAction<Channel[]>>;
  setConnectedVoiceSession: Dispatch<SetStateAction<ConnectedVoiceSession | null>>;
  setConversations: Dispatch<SetStateAction<DirectConversation[]>>;
  setDirectMessageDraft: Dispatch<SetStateAction<string>>;
  setDirectMessages: Dispatch<SetStateAction<DirectMessage[]>>;
  setError: Dispatch<SetStateAction<string>>;
  setFriendRequests: Dispatch<SetStateAction<FriendRequest[]>>;
  setFriends: Dispatch<SetStateAction<Friend[]>>;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  setMetrics: Dispatch<SetStateAction<Record<string, ConnectionMetrics>>>;
  setParticipants: Dispatch<SetStateAction<VoiceParticipant[]>>;
  setPeerDebug: Dispatch<SetStateAction<Record<string, PeerDebugState>>>;
  setProfileForm: Dispatch<
    SetStateAction<{
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
    }>
  >;
  setRefreshToken: Dispatch<SetStateAction<string>>;
  setScreenShareEnabled: Dispatch<SetStateAction<boolean>>;
  setScreenShareLabel: Dispatch<SetStateAction<string>>;
  setSelectedChannelId: Dispatch<SetStateAction<string>>;
  setSelectedConversationId: Dispatch<SetStateAction<string>>;
  setSelectedServerId: Dispatch<SetStateAction<string>>;
  setServers: Dispatch<SetStateAction<Server[]>>;
  setServerMembers: Dispatch<SetStateAction<ServerMember[]>>;
  setStatus: Dispatch<SetStateAction<string>>;
  setToken: Dispatch<SetStateAction<string>>;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
  setUserSearchResults: Dispatch<SetStateAction<AuthUser[]>>;
  setVoiceFlags: Dispatch<SetStateAction<VoiceFlags>>;
  setWorkspaceMode: Dispatch<SetStateAction<WorkspaceMode>>;
  socket: { disconnect: () => void } | null;
  stopDisplayStreamTracks: (stream: MediaStream | null) => void;
  token: string;
};

export function useSessionActions({
  activeVoiceChannelIdRef,
  audioStreamRef,
  asMessage,
  avatarEditor,
  cleanupMixedAudio,
  closeAllPeers,
  displayStreamRef,
  i18n,
  language,
  localStorageKeys,
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
}: UseSessionActionsParams) {
  async function handleUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    try {
      const nextUser = await api.updateProfile(token, profileForm);
      setUser(nextUser);
      setAudioPreferences((current) => ({
        ...current,
        pushToTalkEnabled: nextUser.pushToTalkEnabled ?? current.pushToTalkEnabled,
        voiceActivationEnabled: nextUser.voiceActivationEnabled ?? current.voiceActivationEnabled,
        noiseSuppression: nextUser.noiseSuppressionEnabled ?? current.noiseSuppression,
        echoCancellation: nextUser.echoCancellationEnabled ?? current.echoCancellation,
        autoGainControl: nextUser.autoGainControlEnabled ?? current.autoGainControl,
      }));
      setStatus(`${i18n.profileSettings}: ${nextUser.displayName}`);
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleAvatarFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError(language === 'ru' ? 'Поддерживаются PNG, JPEG и WEBP' : 'Supported formats: PNG, JPEG and WEBP');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarEditor({
          source: reader.result,
          scale: 1,
          offsetX: 0,
          offsetY: 0,
        });
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  function applyAvatarEditor() {
    if (!avatarEditor) {
      return;
    }

    const image = new Image();
    image.onload = () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }

      context.clearRect(0, 0, size, size);
      context.save();
      context.beginPath();
      context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      context.closePath();
      context.clip();

      const baseScale = Math.max(size / image.width, size / image.height);
      const finalScale = baseScale * avatarEditor.scale;
      const drawWidth = image.width * finalScale;
      const drawHeight = image.height * finalScale;
      const x = (size - drawWidth) / 2 + avatarEditor.offsetX;
      const y = (size - drawHeight) / 2 + avatarEditor.offsetY;
      context.drawImage(image, x, y, drawWidth, drawHeight);
      context.restore();

      const dataUrl = canvas.toDataURL('image/png');
      setProfileForm((current) => ({ ...current, avatarUrl: dataUrl }));
      setAvatarEditor(null);
      setStatus(language === 'ru' ? 'Фото выбрано' : 'Image selected');
    };
    image.src = avatarEditor.source;
  }

  async function handleCopy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(`${label}: ${i18n.copied}`);
      pushToast(i18n.copied);
    } catch {
      setError(asMessage(new Error('Clipboard is not available')));
    }
  }

  function logout() {
    socket?.disconnect();
    microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    stopDisplayStreamTracks(displayStreamRef.current);
    cleanupMixedAudio();
    closeAllPeers();
    activeVoiceChannelIdRef.current = '';
    setConnectedVoiceSession(null);
    localStorage.removeItem(localStorageKeys.token);
    localStorage.removeItem(localStorageKeys.refreshToken);
    localStorage.removeItem(localStorageKeys.user);
    setToken('');
    setRefreshToken('');
    setUser(null);
    setWorkspaceMode('servers');
    setServers([]);
    setFriends([]);
    setFriendRequests([]);
    setUserSearchResults([]);
    setConversations([]);
    setSelectedConversationId('');
    setDirectMessages([]);
    setDirectMessageDraft('');
    setChannels([]);
    setMessages([]);
    setServerMembers([]);
    setParticipants([]);
    setMetrics({});
    setSelectedServerId('');
    setSelectedChannelId('');
    setScreenShareEnabled(false);
    setScreenShareLabel('');
    setActiveScreenShares({});
    setPeerDebug({});
    setVoiceFlags({
      muted: false,
      deafened: false,
      pushToTalkActive: false,
      voiceActivationActive: true,
      speaking: false,
    });
    setStatus(i18n.appReady);
  }

  return {
    applyAvatarEditor,
    handleAvatarFileChange,
    handleCopy,
    handleUpdateProfile,
    logout,
  };
}
