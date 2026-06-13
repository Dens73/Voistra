import { useEffect } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

import type { Channel, Server, ServerMember } from '../../types';
import type { AudioEnhancementMode, VoiceFlags, WorkspaceMode } from '../types';

type Params = {
  applyLocalAudioTrackState: (nextFlags: VoiceFlags) => void;
  audioControlForm: { inputLevel: number };
  audioEnhancementMode: AudioEnhancementMode;
  canCreateChannel: boolean;
  channels: Channel[];
  displayStreamRef: MutableRefObject<MediaStream | null>;
  i18n: { unknownUser: string };
  language: 'ru' | 'en';
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
  pollServerChannelNotifications: (token: string, serverId: string) => Promise<void>;
  previewVideoRef: MutableRefObject<HTMLVideoElement | null>;
  publishConnectionMetrics: (channelId: string) => Promise<void>;
  rebuildOutboundAudioStream: () => Promise<void>;
  refreshMediaDevices: () => Promise<void>;
  renegotiatePeers: () => Promise<void>;
  screenShareEnabled: boolean;
  selectedChannel: Channel | null;
  selectedConversationId: string;
  selectedInputDeviceId: string;
  selectedServer: Server | null;
  selectedServerId: string;
  selectedTextChannelId: string;
  setChannels: Dispatch<SetStateAction<Channel[]>>;
  setDirectMessages: Dispatch<SetStateAction<import('../../types').DirectMessage[]>>;
  setError: Dispatch<SetStateAction<string>>;
  setMessages: Dispatch<SetStateAction<import('../../types').Message[]>>;
  setRtcConfig: Dispatch<SetStateAction<RTCConfiguration>>;
  setSelectedChannelId: Dispatch<SetStateAction<string>>;
  setSelectedTextChannelId: Dispatch<SetStateAction<string>>;
  setServerMembers: Dispatch<SetStateAction<ServerMember[]>>;
  setServerSettingsForm: Dispatch<SetStateAction<{ name: string; description: string }>>;
  setVoiceFlags: Dispatch<SetStateAction<VoiceFlags>>;
  shareSystemAudioEnabled: boolean;
  socketConnected: boolean;
  stopMicTest: () => void;
  token: string;
  unlockedChannelIds: string[];
  userId?: string;
  voiceFlags: VoiceFlags;
  workspaceMode: WorkspaceMode;
};

export function useWorkspaceLoadingEffects({
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
  socketConnected,
  stopMicTest,
  token,
  unlockedChannelIds,
  userId,
  voiceFlags,
  workspaceMode,
}: Params) {
  useEffect(() => {
    void refreshMediaDevices();

    const handleDeviceChange = () => {
      void refreshMediaDevices();
    };

    navigator.mediaDevices?.addEventListener?.('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices?.removeEventListener?.('devicechange', handleDeviceChange);
      stopMicTest();
    };
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    void loadServers(token);
    void loadFriends(token);
    void loadFriendRequests(token);
    void loadConversations(token);
  }, [token]);

  useEffect(() => {
    if (!token || !selectedConversationId) {
      setDirectMessages([]);
      return;
    }

    void loadDirectMessages(token, selectedConversationId);
  }, [token, selectedConversationId, setDirectMessages]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadFriends(token);
      void loadFriendRequests(token);
      void loadConversations(token);
    }, 12000);

    return () => window.clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!token || !selectedServerId) {
      return;
    }

    void pollServerChannelNotifications(token, selectedServerId);
    const interval = window.setInterval(() => {
      void pollServerChannelNotifications(token, selectedServerId);
    }, 12000);

    return () => window.clearInterval(interval);
  }, [
    token,
    selectedServerId,
    channels,
    canCreateChannel,
    unlockedChannelIds,
    language,
    i18n.unknownUser,
    selectedTextChannelId,
    userId,
  ]);

  useEffect(() => {
    setChannels([]);
    setMessages([]);
    setSelectedChannelId('');
    setSelectedTextChannelId('');
    setError('');
  }, [selectedServerId, setChannels, setError, setMessages, setSelectedChannelId, setSelectedTextChannelId]);

  useEffect(() => {
    if (!token || !selectedServerId) {
      setChannels([]);
      setServerMembers([]);
      return;
    }

    void loadChannels(token, selectedServerId);
    void loadServerMembers(token, selectedServerId);
  }, [token, selectedServerId, setChannels, setServerMembers]);

  useEffect(() => {
    setServerSettingsForm({
      name: selectedServer?.name ?? '',
      description: selectedServer?.description ?? '',
    });
  }, [selectedServer?.id, selectedServer?.name, selectedServer?.description, setServerSettingsForm]);

  useEffect(() => {
    if (!token || !selectedServerId || !selectedChannel || selectedChannel.type !== 'text') {
      if (workspaceMode !== 'servers' || !linkedTextChannel) {
        setMessages([]);
        return;
      }
    }

    const targetChannelId = selectedChannel?.type === 'text' ? selectedChannel.id : linkedTextChannel?.id;
    if (!targetChannelId || !selectedServerId || !token || workspaceMode !== 'servers') {
      setMessages([]);
      return;
    }

    void loadMessages(token, selectedServerId, targetChannelId);
  }, [linkedTextChannel?.id, selectedChannel, selectedServerId, setMessages, token, workspaceMode]);

  useEffect(() => {
    if (!selectedTextChannelId && linkedTextChannel) {
      setSelectedTextChannelId(linkedTextChannel.id);
      return;
    }

    if (selectedTextChannelId && !channels.find((channel) => channel.id === selectedTextChannelId) && linkedTextChannel) {
      setSelectedTextChannelId(linkedTextChannel.id);
    }
  }, [channels, linkedTextChannel, selectedTextChannelId, setSelectedTextChannelId]);

  useEffect(() => {
    if (!screenShareEnabled || !previewVideoRef.current || !displayStreamRef.current) {
      return;
    }

    previewVideoRef.current.srcObject = displayStreamRef.current;
  }, [screenShareEnabled, previewVideoRef, displayStreamRef]);

  useEffect(() => {
    if (!microphoneStreamRef.current) {
      return;
    }

    void rebuildOutboundAudioStream();
    void renegotiatePeers();
  }, [audioControlForm.inputLevel, shareSystemAudioEnabled, selectedInputDeviceId, audioEnhancementMode]);

  useEffect(() => {
    if (!socketConnected || !selectedChannel || selectedChannel.type !== 'voice') {
      return;
    }

    const interval = window.setInterval(() => {
      void publishConnectionMetrics(selectedChannel.id);
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [socketConnected, selectedChannel, userId]);

  useEffect(() => {
    applyLocalAudioTrackState(voiceFlags);
  }, [
    voiceFlags.muted,
    voiceFlags.deafened,
    voiceFlags.speaking,
    voiceFlags.pushToTalkActive,
    voiceFlags.voiceActivationActive,
    applyLocalAudioTrackState,
  ]);
}
