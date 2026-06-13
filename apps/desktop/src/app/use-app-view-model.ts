import { useMemo } from 'react';

import type {
  AuthUser,
  Channel,
  DirectConversation,
  Server,
  ServerMember,
  VoiceParticipant,
} from '../types';
import type { Language, ServerPanelTab, WorkspaceMode } from './types';

type ViewModelCopy = {
  adminRole: string;
  defaultOutput: string;
  memberRole: string;
  ownerRole: string;
  yes: string;
  no: string;
  you: string;
};

type UseAppViewModelParams = {
  activeScreenShares: Record<string, string>;
  channelAccessForm: { channelId: string };
  channelPanelOpen: boolean;
  channels: Channel[];
  connectedVoiceSession: { serverId: string } | null;
  conversations: DirectConversation[];
  i18n: ViewModelCopy;
  inputDevices: MediaDeviceInfo[];
  language: Language;
  outputDevices: MediaDeviceInfo[];
  participants: VoiceParticipant[];
  profileForm: { avatarUrl: string };
  selectedConversationId: string;
  selectedInputDeviceId: string;
  selectedMemberActionUserId: string;
  selectedOutputDeviceId: string;
  selectedServerId: string;
  selectedTextChannelId: string;
  serverMembers: ServerMember[];
  servers: Server[];
  textChannelsSource?: Channel[];
  unlockedChannelIds: string[];
  user: AuthUser | null;
  workspaceMode: WorkspaceMode;
  setAdminPanelOpen: (value: boolean | ((current: boolean) => boolean)) => void;
  setServerPanelTab: (value: ServerPanelTab) => void;
};

export function useAppViewModel({
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
}: UseAppViewModelParams) {
  const selectedServer = useMemo(
    () => servers.find((server) => server.id === selectedServerId) ?? null,
    [servers, selectedServerId],
  );
  const railActiveServerId = connectedVoiceSession?.serverId ?? selectedServerId;
  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );
  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.id === selectedChannelId) ?? null,
    [channels, selectedChannelId],
  );
  const textChannels = useMemo(
    () => channels.filter((channel) => channel.type === 'text'),
    [channels],
  );
  const voiceChannels = useMemo(
    () => channels.filter((channel) => channel.type === 'voice'),
    [channels],
  );
  const participantNameMap = useMemo(
    () => new Map(participants.map((participant) => [participant.userId, participant.username])),
    [participants],
  );
  const memberNameMap = useMemo(
    () =>
      new Map(
        serverMembers.map((member) => [
          member.userId,
          member.user?.displayName ?? member.user?.username ?? member.userId,
        ]),
      ),
    [serverMembers],
  );
  const activeShareEntries = useMemo(
    () =>
      Object.entries(activeScreenShares).map(([userId, sourceName]) => ({
        userId,
        sourceName,
        label:
          participantNameMap.get(userId) ??
          memberNameMap.get(userId) ??
          (user?.id === userId ? user.username : userId),
      })),
    [activeScreenShares, memberNameMap, participantNameMap, user],
  );
  const pendingLockedChannel = useMemo(
    () => channels.find((channel) => channel.id === channelAccessForm.channelId) ?? null,
    [channelAccessForm.channelId, channels],
  );
  const canManageServer = useMemo(
    () => Boolean(selectedServer && ['owner', 'admin'].includes(selectedServer.currentUserRole)),
    [selectedServer],
  );
  const canCreateChannel = useMemo(
    () => Boolean(selectedServer && selectedServer.currentUserRole === 'owner'),
    [selectedServer],
  );
  const currentServerMember = useMemo(
    () => serverMembers.find((member) => member.userId === user?.id) ?? null,
    [serverMembers, user?.id],
  );
  const selectedManagedMember = useMemo(
    () => serverMembers.find((member) => member.userId === selectedMemberActionUserId) ?? null,
    [selectedMemberActionUserId, serverMembers],
  );
  const linkedTextChannel = useMemo(() => {
    const selectedTextChannel = textChannels.find((channel) => channel.id === selectedTextChannelId);
    if (selectedTextChannel) {
      return selectedTextChannel;
    }

    return (
      textChannels.find((channel) => !channel.isPrivate || canCreateChannel || unlockedChannelIds.includes(channel.id)) ??
      textChannels[0] ??
      null
    );
  }, [canCreateChannel, selectedTextChannelId, textChannels, unlockedChannelIds]);
  const showChannelSidebar = workspaceMode === 'servers' && channelPanelOpen;
  const avatarPreview = profileForm.avatarUrl || user?.avatarUrl || '';
  const shellUser = user ? { ...user, avatarUrl: avatarPreview || user.avatarUrl } : null;
  const currentInputDeviceLabel =
    inputDevices.find((device) => device.deviceId === selectedInputDeviceId)?.label ||
    (language === 'ru' ? 'Системный микрофон' : 'System microphone');
  const currentOutputDeviceLabel =
    outputDevices.find((device) => device.deviceId === selectedOutputDeviceId)?.label || i18n.defaultOutput;

  const hasActiveModeration = (value?: string | Date | null) =>
    Boolean(value && new Date(value).getTime() > Date.now());
  const roleLabel = (role?: string) => {
    switch (role) {
      case 'owner':
        return i18n.ownerRole;
      case 'admin':
        return i18n.adminRole;
      default:
        return i18n.memberRole;
    }
  };
  const openAdminPanel = (tab: ServerPanelTab = 'settings') => {
    setServerPanelTab(tab);
    setAdminPanelOpen(true);
  };
  const toggleAdminPanel = (tab: ServerPanelTab = 'settings') => {
    setAdminPanelOpen((current) => {
      if (current) {
        return false;
      }
      setServerPanelTab(tab);
      return true;
    });
  };
  const peerLabel = (userId: string) => {
    if (userId === user?.id) {
      return i18n.you;
    }

    return (
      participants.find((participant) => participant.userId === userId)?.username ??
      serverMembers.find((member) => member.userId === userId)?.user?.displayName ??
      serverMembers.find((member) => member.userId === userId)?.user?.username ??
      userId
    );
  };
  const yesNo = (value: boolean) => (value ? i18n.yes : i18n.no);

  return {
    activeShareEntries,
    avatarPreview,
    canCreateChannel,
    canManageServer,
    currentInputDeviceLabel,
    currentOutputDeviceLabel,
    currentServerMember,
    hasActiveModeration,
    linkedTextChannel,
    memberNameMap,
    openAdminPanel,
    participantNameMap,
    peerLabel,
    pendingLockedChannel,
    railActiveServerId,
    roleLabel,
    selectedChannel,
    selectedConversation,
    selectedConversationId,
    selectedManagedMember,
    selectedServer,
    selectedTextChannelId,
    shellUser,
    showChannelSidebar,
    textChannels,
    toggleAdminPanel,
    voiceChannels,
    yesNo,
  };
}
