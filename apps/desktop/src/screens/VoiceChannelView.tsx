import type { RefObject } from 'react';

import { VoiceParticipantsPanel } from '../components/VoiceParticipantsPanel';
import { VoiceSharePanel } from '../components/VoiceSharePanel';
import type { Language, RemoteMedia, VoiceFlags } from '../app/types';
import type { AuthUser, Server, ServerMember, VoiceParticipant } from '../types';

type VoiceChannelStrings = {
  allowStreamAudio: string;
  copyId: string;
  inactive: string;
  joinVoice: string;
  leaveVoice: string;
  live: string;
  members: string;
  membersTab: string;
  openDialog: string;
  overviewTab: string;
  owner: string;
  participantVolume: string;
  people: string;
  screenShare: string;
  serverOverview: string;
  settingsTab: string;
  startShare: string;
  stopShare: string;
  unknownUser: string;
  voiceControl: string;
};

type VoiceChannelViewProps = {
  activeScreenShares: Record<string, string>;
  adminPanelOpen: boolean;
  audioOutputLevel: number;
  canManageServer: boolean;
  currentRoleLabel: string;
  i18n: VoiceChannelStrings;
  language: Language;
  participants: VoiceParticipant[];
  previewVideoRef: RefObject<HTMLVideoElement | null>;
  remoteMedia: Record<string, RemoteMedia>;
  remoteParticipantVolumes: Record<string, number>;
  remoteShareVolumes: Record<string, number>;
  screenShareEnabled: boolean;
  selectedManagedMember: ServerMember | null;
  selectedMemberActionUserId: string;
  selectedOutputDeviceId: string;
  selectedServer: Server | null;
  serverMembers: ServerMember[];
  serverPanelTab: 'overview' | 'members' | 'settings';
  shareSystemAudioEnabled: boolean;
  user: AuthUser;
  voiceFlags: VoiceFlags;
  onClearMemberRestrictions: (userId: string) => void | Promise<void>;
  onCopy: (value: string, label: string) => void | Promise<void>;
  onJoinVoice: () => void | Promise<void>;
  onLeaveVoice: () => void | Promise<void>;
  onModerateMember: (userId: string, action: 'mute' | 'deafen' | 'block_share' | 'ban', durationMinutes: number) => void | Promise<void>;
  onOpenConversation: (userId: string) => void | Promise<void>;
  onRemoveMember: (userId: string) => void;
  onSetMemberActionUserId: (updater: (current: string) => string) => void;
  onSetRemoteParticipantVolume: (updater: (current: Record<string, number>) => Record<string, number>) => void;
  onSetRemoteShareVolume: (updater: (current: Record<string, number>) => Record<string, number>) => void;
  onSetServerPanelTab: (tab: 'overview' | 'members' | 'settings') => void;
  onSetShareSystemAudioEnabled: (value: boolean) => void;
  onStartScreenShare: () => void | Promise<void>;
  onStopScreenShare: () => void;
  onToggleDeafen: () => void | Promise<void>;
  onToggleMute: () => void | Promise<void>;
  onToggleScreenShare: () => void | Promise<void>;
};

export function VoiceChannelView({
  activeScreenShares,
  adminPanelOpen,
  audioOutputLevel,
  canManageServer,
  currentRoleLabel,
  i18n,
  language,
  participants,
  previewVideoRef,
  remoteMedia,
  remoteParticipantVolumes,
  remoteShareVolumes,
  screenShareEnabled,
  selectedManagedMember,
  selectedMemberActionUserId,
  selectedOutputDeviceId,
  selectedServer,
  serverMembers,
  serverPanelTab,
  shareSystemAudioEnabled,
  user,
  voiceFlags,
  onClearMemberRestrictions,
  onCopy,
  onJoinVoice,
  onLeaveVoice,
  onModerateMember,
  onOpenConversation,
  onRemoveMember,
  onSetMemberActionUserId,
  onSetRemoteParticipantVolume,
  onSetRemoteShareVolume,
  onSetServerPanelTab,
  onSetShareSystemAudioEnabled,
  onStartScreenShare,
  onStopScreenShare,
  onToggleDeafen,
  onToggleMute,
  onToggleScreenShare,
}: VoiceChannelViewProps) {
  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <VoiceParticipantsPanel
        activeScreenShares={activeScreenShares}
        audioOutputLevel={audioOutputLevel}
        i18n={i18n}
        language={language}
        participants={participants}
        remoteMedia={remoteMedia}
        remoteParticipantVolumes={remoteParticipantVolumes}
        remoteShareVolumes={remoteShareVolumes}
        screenShareEnabled={screenShareEnabled}
        selectedOutputDeviceId={selectedOutputDeviceId}
        user={user}
        voiceFlags={voiceFlags}
        onJoinVoice={onJoinVoice}
        onLeaveVoice={onLeaveVoice}
        onSetRemoteParticipantVolume={onSetRemoteParticipantVolume}
        onSetRemoteShareVolume={onSetRemoteShareVolume}
        onToggleDeafen={onToggleDeafen}
        onToggleMute={onToggleMute}
        onToggleScreenShare={onToggleScreenShare}
      />

      <VoiceSharePanel
        adminPanelOpen={adminPanelOpen}
        canManageServer={canManageServer}
        currentRoleLabel={currentRoleLabel}
        i18n={i18n}
        language={language}
        previewVideoRef={previewVideoRef}
        screenShareEnabled={screenShareEnabled}
        selectedManagedMember={selectedManagedMember}
        selectedMemberActionUserId={selectedMemberActionUserId}
        selectedServer={selectedServer}
        serverMembers={serverMembers}
        serverPanelTab={serverPanelTab}
        shareSystemAudioEnabled={shareSystemAudioEnabled}
        userId={user.id}
        onClearMemberRestrictions={onClearMemberRestrictions}
        onCopy={onCopy}
        onModerateMember={onModerateMember}
        onOpenConversation={onOpenConversation}
        onRemoveMember={onRemoveMember}
        onSetMemberActionUserId={onSetMemberActionUserId}
        onSetServerPanelTab={onSetServerPanelTab}
        onSetShareSystemAudioEnabled={onSetShareSystemAudioEnabled}
        onStartScreenShare={onStartScreenShare}
        onStopScreenShare={onStopScreenShare}
      />
    </section>
  );
}
