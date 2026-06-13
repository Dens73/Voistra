import type { FormEvent, RefObject } from 'react';

import { FriendsView } from '../screens/FriendsView';
import { ProfileView } from '../screens/ProfileView';
import { ServerDashboardView } from '../screens/ServerDashboardView';
import { TextChannelView } from '../screens/TextChannelView';
import { VoiceChannelView } from '../screens/VoiceChannelView';
import { TextChannelAdminPanel } from './TextChannelAdminPanel';
import { ToggleRow } from './app-primitives';
import type {
  AudioEnhancementMode,
  Language,
  ProfilePanelTab,
  RemoteMedia,
  ServerPanelTab,
  VoiceFlags,
} from '../app/types';
import type {
  AuthUser,
  Channel,
  DirectConversation,
  DirectMessage,
  Friend,
  FriendRequest,
  Message,
  Server,
  ServerMember,
  VoiceParticipant,
} from '../types';

type WorkspaceContentRouterProps = {
  activeScreenShares: Record<string, string>;
  adminPanelOpen: boolean;
  audioControlForm: { inputLevel: number; outputLevel: number };
  audioEnhancementMode: AudioEnhancementMode;
  avatarInputRef: RefObject<HTMLInputElement | null>;
  avatarPreview: string;
  canCreateChannel: boolean;
  canManageServer: boolean;
  channelSettingsDrafts: Record<string, { name: string; isPrivate: boolean; password: string }>;
  channels: Channel[];
  createChannelForm: { name: string; type: 'text' | 'voice'; isPrivate: boolean; password: string };
  currentInputDeviceLabel: string;
  currentOutputDeviceLabel: string;
  currentRoleLabel: string;
  directMessageDraft: string;
  directMessages: DirectMessage[];
  friendRequests: FriendRequest[];
  friends: Friend[];
  i18n: any;
  inputDevices: MediaDeviceInfo[];
  language: Language;
  messageDraft: string;
  messages: Message[];
  micTestLevel: number;
  micTestRunning: boolean;
  onlineUserIds: string[];
  outputDevices: MediaDeviceInfo[];
  participants: VoiceParticipant[];
  previewVideoRef: RefObject<HTMLVideoElement | null>;
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
  profilePanelTab: ProfilePanelTab;
  remoteMedia: Record<string, RemoteMedia>;
  remoteParticipantVolumes: Record<string, number>;
  remoteShareVolumes: Record<string, number>;
  screenShareEnabled: boolean;
  selectedChannel: Channel | null;
  selectedConversation: DirectConversation | null;
  selectedInputDeviceId: string;
  selectedManagedMember: ServerMember | null;
  selectedMemberActionUserId: string;
  selectedOutputDeviceId: string;
  selectedServer: Server | null;
  selectedServerId: string;
  serverMembers: ServerMember[];
  serverPanelTab: ServerPanelTab;
  serverSettingsForm: { name: string; description: string };
  shareSystemAudioEnabled: boolean;
  textChannels: Channel[];
  user: AuthUser;
  userSearchQuery: string;
  userSearchResults: AuthUser[];
  voiceChannels: Channel[];
  voiceFlags: VoiceFlags;
  workspaceMode: 'servers' | 'friends' | 'profile';
  onAcceptFriendRequest: (requestId: string) => void;
  onAudioControlChange: (updater: (current: { inputLevel: number; outputLevel: number }) => { inputLevel: number; outputLevel: number }) => void;
  onAudioEnhancementModeChange: (mode: AudioEnhancementMode) => void;
  onClearMemberRestrictions: (userId: string) => void;
  onCloseAdminPanel: () => void;
  onCopy: (value: string, label: string) => void;
  onCreateChannel: (event: FormEvent<HTMLFormElement>) => void;
  onCreateChannelFormChange: (updater: (current: { name: string; type: 'text' | 'voice'; isPrivate: boolean; password: string }) => { name: string; type: 'text' | 'voice'; isPrivate: boolean; password: string }) => void;
  onDirectDraftChange: (value: string) => void;
  onInputDeviceChange: (value: string) => void;
  onMessageDraftChange: (value: string) => void;
  onModerateMember: (
    userId: string,
    action: 'mute' | 'deafen' | 'block_share' | 'ban' | 'clear_mute' | 'clear_deafen' | 'clear_block_share' | 'clear_ban',
    durationMinutes?: number,
  ) => void;
  onOpenAdminPanel: () => void;
  onOpenConversation: (userId: string) => void;
  onOutputDeviceChange: (value: string) => void;
  onProfileFormChange: (updater: (current: WorkspaceContentRouterProps['profileForm']) => WorkspaceContentRouterProps['profileForm']) => void;
  onProfilePanelTabChange: (tab: ProfilePanelTab) => void;
  onProfileSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRemoveChannel: (channelId: string) => void;
  onRemoveFriend: (userId: string) => void;
  onRemoveMember: (userId: string) => void;
  onSearchQueryChange: (value: string) => void;
  onSearchUsers: (event: FormEvent<HTMLFormElement>) => void;
  onSelectChannel: (channel: Channel) => void;
  onSendDirectMessage: (event: FormEvent<HTMLFormElement>) => void;
  onSendFriendRequest: (userId: string) => void;
  onSendMessage: (event: FormEvent<HTMLFormElement>) => void;
  onServerSettingsFormChange: (updater: (current: { name: string; description: string }) => { name: string; description: string }) => void;
  onSetChannelSettingsDrafts: (updater: (current: Record<string, { name: string; isPrivate: boolean; password: string }>) => Record<string, { name: string; isPrivate: boolean; password: string }>) => void;
  onSetMemberActionUserId: (updater: string | ((current: string) => string)) => void;
  onSetRemoteParticipantVolume: (updater: (current: Record<string, number>) => Record<string, number>) => void;
  onSetRemoteShareVolume: (updater: (current: Record<string, number>) => Record<string, number>) => void;
  onSetServerPanelTab: (tab: ServerPanelTab) => void;
  onSetShareSystemAudioEnabled: (value: boolean) => void;
  onJoinVoice: () => void;
  onLeaveVoice: () => void;
  onStartScreenShare: () => void;
  onStopScreenShare: () => void;
  onToggleDeafen: () => void;
  onToggleMicrophoneTest: () => void;
  onToggleMute: () => void;
  onToggleScreenShare: () => void;
  onUpdateChannel: (channelId: string) => void;
  onUpdateServer: (event: FormEvent<HTMLFormElement>) => void;
};

export function WorkspaceContentRouter(props: WorkspaceContentRouterProps) {
  const {
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
    currentRoleLabel,
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
    onAcceptFriendRequest,
    onAudioControlChange,
    onAudioEnhancementModeChange,
    onClearMemberRestrictions,
    onCloseAdminPanel,
    onCopy,
    onCreateChannel,
    onCreateChannelFormChange,
    onDirectDraftChange,
    onInputDeviceChange,
    onMessageDraftChange,
    onModerateMember,
    onOpenAdminPanel,
    onOpenConversation,
    onOutputDeviceChange,
    onProfileFormChange,
    onProfilePanelTabChange,
    onProfileSubmit,
    onRemoveChannel,
    onRemoveFriend,
    onRemoveMember,
    onSearchQueryChange,
    onSearchUsers,
    onSelectChannel,
    onSendDirectMessage,
    onSendFriendRequest,
    onSendMessage,
    onServerSettingsFormChange,
    onSetChannelSettingsDrafts,
    onSetMemberActionUserId,
    onSetRemoteParticipantVolume,
    onSetRemoteShareVolume,
    onSetServerPanelTab,
    onSetShareSystemAudioEnabled,
    onJoinVoice,
    onLeaveVoice,
    onStartScreenShare,
    onStopScreenShare,
    onToggleDeafen,
    onToggleMicrophoneTest,
    onToggleMute,
    onToggleScreenShare,
    onUpdateChannel,
    onUpdateServer,
  } = props;

  if (workspaceMode === 'friends') {
    return (
      <FriendsView
        i18n={i18n}
        language={language}
        selectedConversation={selectedConversation}
        directMessages={directMessages}
        directMessageDraft={directMessageDraft}
        friends={friends}
        friendRequests={friendRequests}
        onlineUserIds={onlineUserIds}
        userSearchQuery={userSearchQuery}
        userSearchResults={userSearchResults}
        onDirectDraftChange={onDirectDraftChange}
        onSendDirectMessage={onSendDirectMessage}
        onSearchUsers={onSearchUsers}
        onSearchQueryChange={onSearchQueryChange}
        onSendFriendRequest={onSendFriendRequest}
        onAcceptFriendRequest={onAcceptFriendRequest}
        onOpenConversation={onOpenConversation}
        onCopy={onCopy}
        onRemoveFriend={onRemoveFriend}
      />
    );
  }

  if (workspaceMode === 'profile') {
    return (
      <ProfileView
        i18n={i18n}
        language={language}
        user={user}
        profilePanelTab={profilePanelTab}
        profileForm={profileForm}
        avatarPreview={avatarPreview}
        inputDevices={inputDevices}
        outputDevices={outputDevices}
        selectedInputDeviceId={selectedInputDeviceId}
        selectedOutputDeviceId={selectedOutputDeviceId}
        currentInputDeviceLabel={currentInputDeviceLabel}
        currentOutputDeviceLabel={currentOutputDeviceLabel}
        audioControlForm={audioControlForm}
        micTestRunning={micTestRunning}
        micTestLevel={micTestLevel}
        audioEnhancementMode={audioEnhancementMode}
        onProfilePanelTabChange={onProfilePanelTabChange}
        onProfileSubmit={onProfileSubmit}
        onAvatarChoose={() => avatarInputRef.current?.click()}
        onAvatarRemove={() => onProfileFormChange((current) => ({ ...current, avatarUrl: '' }))}
        onProfileFormChange={onProfileFormChange}
        onInputDeviceChange={onInputDeviceChange}
        onOutputDeviceChange={onOutputDeviceChange}
        onAudioControlChange={onAudioControlChange}
        onToggleMicrophoneTest={onToggleMicrophoneTest}
        onAudioEnhancementModeChange={onAudioEnhancementModeChange}
        renderAudioProcessing={
          <div className="space-y-3">
            <ToggleRow label={i18n.voiceActivation} checked={profileForm.voiceActivationEnabled} onChange={(checked) => onProfileFormChange((current) => ({ ...current, voiceActivationEnabled: checked }))} />
            <ToggleRow label={i18n.noiseSuppression} checked={profileForm.noiseSuppressionEnabled} onChange={(checked) => onProfileFormChange((current) => ({ ...current, noiseSuppressionEnabled: checked }))} />
            <ToggleRow label={i18n.echoCancellation} checked={profileForm.echoCancellationEnabled} onChange={(checked) => onProfileFormChange((current) => ({ ...current, echoCancellationEnabled: checked }))} />
            <ToggleRow label={i18n.autoGainControl} checked={profileForm.autoGainControlEnabled} onChange={(checked) => onProfileFormChange((current) => ({ ...current, autoGainControlEnabled: checked }))} />
          </div>
        }
      />
    );
  }

  if (selectedChannel?.type === 'text') {
    return (
      <TextChannelView
        i18n={i18n}
        messages={messages}
        messageDraft={messageDraft}
        onMessageDraftChange={onMessageDraftChange}
        onSendMessage={onSendMessage}
        renderSidePanel={adminPanelOpen ? (
          <TextChannelAdminPanel
            i18n={i18n}
            language={language}
            userId={user.id}
            canManageServer={canManageServer}
            canCreateChannel={canCreateChannel}
            selectedServer={selectedServer}
            serverMembers={serverMembers}
            serverPanelTab={serverPanelTab}
            selectedMemberActionUserId={selectedMemberActionUserId}
            createChannelForm={createChannelForm}
            serverSettingsForm={serverSettingsForm}
            channelSettingsDrafts={channelSettingsDrafts}
            channels={channels}
            onSetServerPanelTab={onSetServerPanelTab}
            onSetSelectedMemberActionUserId={onSetMemberActionUserId}
            onSetCreateChannelForm={onCreateChannelFormChange}
            onSetServerSettingsForm={onServerSettingsFormChange}
            onSetChannelSettingsDrafts={onSetChannelSettingsDrafts}
            onCopy={onCopy}
            onOpenConversation={onOpenConversation}
            onModerateMember={onModerateMember}
            onClearMemberRestrictions={onClearMemberRestrictions}
            onRemoveMember={onRemoveMember}
            onCreateChannel={onCreateChannel}
            onUpdateServer={onUpdateServer}
            onUpdateChannel={onUpdateChannel}
            onRemoveSpecificChannel={onRemoveChannel}
            roleLabel={() => currentRoleLabel}
          />
        ) : null}
      />
    );
  }

  if (selectedChannel?.type === 'voice') {
    return (
      <VoiceChannelView
        activeScreenShares={activeScreenShares}
        adminPanelOpen={adminPanelOpen}
        audioOutputLevel={audioControlForm.outputLevel}
        canManageServer={canManageServer}
        currentRoleLabel={currentRoleLabel}
        i18n={i18n}
        language={language}
        participants={participants}
        previewVideoRef={previewVideoRef}
        remoteMedia={remoteMedia}
        remoteParticipantVolumes={remoteParticipantVolumes}
        remoteShareVolumes={remoteShareVolumes}
        screenShareEnabled={screenShareEnabled}
        selectedManagedMember={selectedManagedMember}
        selectedMemberActionUserId={selectedMemberActionUserId}
        selectedOutputDeviceId={selectedOutputDeviceId}
        selectedServer={selectedServer}
        serverMembers={serverMembers}
        serverPanelTab={serverPanelTab}
        shareSystemAudioEnabled={shareSystemAudioEnabled}
        user={user}
        voiceFlags={voiceFlags}
        onClearMemberRestrictions={onClearMemberRestrictions}
        onCopy={onCopy}
        onJoinVoice={onJoinVoice}
        onLeaveVoice={onLeaveVoice}
        onModerateMember={onModerateMember}
        onOpenConversation={onOpenConversation}
        onRemoveMember={onRemoveMember}
        onSetMemberActionUserId={onSetMemberActionUserId}
        onSetRemoteParticipantVolume={onSetRemoteParticipantVolume}
        onSetRemoteShareVolume={onSetRemoteShareVolume}
        onSetServerPanelTab={onSetServerPanelTab}
        onSetShareSystemAudioEnabled={onSetShareSystemAudioEnabled}
        onStartScreenShare={onStartScreenShare}
        onStopScreenShare={onStopScreenShare}
        onToggleDeafen={onToggleDeafen}
        onToggleMute={onToggleMute}
        onToggleScreenShare={onToggleScreenShare}
      />
    );
  }

  return (
    <ServerDashboardView
      adminPanelOpen={adminPanelOpen}
      canCreateChannel={canCreateChannel}
      canManageServer={canManageServer}
      channelSettingsDrafts={channelSettingsDrafts}
      channels={channels}
      createChannelForm={createChannelForm}
      i18n={i18n}
      language={language}
      selectedServer={selectedServer}
      selectedServerId={selectedServerId}
      serverSettingsForm={serverSettingsForm}
      textChannels={textChannels}
      voiceChannels={voiceChannels}
      onChannelSettingsDraftsChange={onSetChannelSettingsDrafts}
      onCloseAdminPanel={onCloseAdminPanel}
      onCreateChannel={onCreateChannel}
      onCreateChannelFormChange={onCreateChannelFormChange}
      onOpenAdminPanel={onOpenAdminPanel}
      onRemoveChannel={onRemoveChannel}
      onSelectChannel={onSelectChannel}
      onServerSettingsFormChange={onServerSettingsFormChange}
      onUpdateChannel={onUpdateChannel}
      onUpdateServer={onUpdateServer}
    />
  );
}
