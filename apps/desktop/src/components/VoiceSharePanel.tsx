import type { RefObject } from 'react';

import { ActionIcon, UserIdentity } from './app-primitives';
import type { Language } from '../app/types';
import type { Server, ServerMember } from '../types';

type VoiceSharePanelProps = {
  adminPanelOpen: boolean;
  canManageServer: boolean;
  currentRoleLabel: string;
  i18n: {
    allowStreamAudio: string;
    copyId: string;
    inactive: string;
    live: string;
    members: string;
    membersTab: string;
    openDialog: string;
    overviewTab: string;
    owner: string;
    screenShare: string;
    serverOverview: string;
    settingsTab: string;
    startShare: string;
    stopShare: string;
    unknownUser: string;
  };
  language: Language;
  previewVideoRef: RefObject<HTMLVideoElement | null>;
  screenShareEnabled: boolean;
  selectedManagedMember: ServerMember | null;
  selectedMemberActionUserId: string;
  selectedServer: Server | null;
  serverMembers: ServerMember[];
  serverPanelTab: 'overview' | 'members' | 'settings';
  shareSystemAudioEnabled: boolean;
  userId: string;
  onClearMemberRestrictions: (userId: string) => void | Promise<void>;
  onCopy: (value: string, label: string) => void | Promise<void>;
  onModerateMember: (userId: string, action: 'mute' | 'deafen' | 'block_share' | 'ban', durationMinutes: number) => void | Promise<void>;
  onOpenConversation: (userId: string) => void | Promise<void>;
  onRemoveMember: (userId: string) => void;
  onSetMemberActionUserId: (updater: (current: string) => string) => void;
  onSetServerPanelTab: (tab: 'overview' | 'members' | 'settings') => void;
  onSetShareSystemAudioEnabled: (value: boolean) => void;
  onStartScreenShare: () => void | Promise<void>;
  onStopScreenShare: () => void;
};

export function VoiceSharePanel({
  adminPanelOpen,
  canManageServer,
  currentRoleLabel,
  i18n,
  language,
  previewVideoRef,
  screenShareEnabled,
  selectedManagedMember,
  selectedMemberActionUserId,
  selectedServer,
  serverMembers,
  serverPanelTab,
  shareSystemAudioEnabled,
  userId,
  onClearMemberRestrictions,
  onCopy,
  onModerateMember,
  onOpenConversation,
  onRemoveMember,
  onSetMemberActionUserId,
  onSetServerPanelTab,
  onSetShareSystemAudioEnabled,
  onStartScreenShare,
  onStopScreenShare,
}: VoiceSharePanelProps) {
  return (
    <aside className="space-y-4 rounded-[28px] border border-white/6 bg-[#171a1d] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">{i18n.screenShare}</h3>
        <span className="text-sm text-slate-500">{screenShareEnabled ? i18n.live : i18n.inactive}</span>
      </div>
      <div className="flex gap-2">
        <button className="flex-1 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white" type="button" onClick={() => void onStartScreenShare()}>{i18n.startShare}</button>
        <button className="flex-1 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-200" type="button" onClick={onStopScreenShare}>{i18n.stopShare}</button>
      </div>
      <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
        <span>{i18n.allowStreamAudio}</span>
        <input type="checkbox" checked={shareSystemAudioEnabled} onChange={(event) => onSetShareSystemAudioEnabled(event.target.checked)} />
      </label>
      <div className="overflow-hidden rounded-[24px] border border-white/6 bg-[#101214] p-2">
        <video ref={previewVideoRef} autoPlay muted playsInline className="w-full rounded-[18px]" />
      </div>

      {adminPanelOpen && selectedServer ? (
        <div className="grid gap-3 rounded-[24px] border border-white/6 bg-white/[0.03] p-4">
          <div>
            <h4 className="text-sm font-semibold text-white">{i18n.serverOverview}</h4>
            <p className="text-xs text-slate-500">{currentRoleLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={serverPanelTab === 'overview' ? 'rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white' : 'rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-300'} type="button" onClick={() => onSetServerPanelTab('overview')}>{i18n.overviewTab}</button>
            <button className={serverPanelTab === 'members' ? 'rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white' : 'rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-300'} type="button" onClick={() => onSetServerPanelTab('members')}>{i18n.membersTab}</button>
            <button className={serverPanelTab === 'settings' ? 'rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white' : 'rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-300'} type="button" onClick={() => onSetServerPanelTab('settings')}>{i18n.settingsTab}</button>
          </div>

          {serverPanelTab === 'overview' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/6 bg-[#121417] p-3"><span className="block text-[11px] text-slate-500">{i18n.owner}</span><strong className="mt-1 block text-sm text-white">{selectedServer.owner?.displayName ?? i18n.unknownUser}</strong></div>
              <div className="rounded-3xl border border-white/6 bg-[#121417] p-3"><span className="block text-[11px] text-slate-500">{i18n.members}</span><strong className="mt-1 block text-sm text-white">{selectedServer.memberCount ?? 0}</strong></div>
            </div>
          ) : null}

          {serverPanelTab === 'members' ? (
            <div className="grid gap-3">
              {serverMembers.map((member) => (
                <div key={`voice-member-${member.id}`} className="rounded-3xl border border-white/6 bg-[#121417] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <UserIdentity displayName={member.user?.displayName ?? member.user?.username ?? member.userId} username={member.user?.username ?? i18n.unknownUser} subtitle={`@${member.user?.username ?? i18n.unknownUser}`} compact />
                    <button className="inline-grid h-9 w-9 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300" type="button" onClick={() => onSetMemberActionUserId((current) => current === member.userId ? '' : member.userId)}>
                      <ActionIcon kind="more" />
                    </button>
                  </div>
                  {selectedMemberActionUserId === member.userId ? (
                    <div className="mt-3 grid gap-2">
                      <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-left text-sm text-slate-200" type="button" onClick={() => void onCopy(member.userId, i18n.copyId)}>{i18n.copyId}</button>
                      {member.userId !== userId ? <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-left text-sm text-slate-200" type="button" onClick={() => void onOpenConversation(member.userId)}>{i18n.openDialog}</button> : null}
                      {canManageServer && !member.isOwner && member.userId !== userId ? <button className="rounded-2xl border border-red-400/16 bg-red-500/10 px-3 py-2 text-left text-sm font-medium text-red-200" type="button" onClick={() => onRemoveMember(member.userId)}>{language === 'ru' ? 'Удалить с сервера' : 'Remove from server'}</button> : null}
                    </div>
                  ) : null}
                </div>
              ))}

              {selectedManagedMember && canManageServer && !selectedManagedMember.isOwner && selectedManagedMember.userId !== userId ? (
                <div className="grid gap-3 rounded-3xl border border-white/6 bg-white/[0.03] p-3">
                  <div>
                    <h5 className="text-sm font-semibold text-white">{language === 'ru' ? 'Управление участником' : 'Member controls'}</h5>
                    <p className="text-xs text-slate-500">{selectedManagedMember.user?.displayName ?? selectedManagedMember.user?.username ?? selectedManagedMember.userId}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedManagedMember.moderation?.isMuted ? <span className="rounded-full bg-amber-500/12 px-2.5 py-1 text-[11px] font-medium text-amber-100">{language === 'ru' ? 'Микрофон выкл' : 'Muted'}</span> : null}
                    {selectedManagedMember.moderation?.isDeafened ? <span className="rounded-full bg-sky-500/12 px-2.5 py-1 text-[11px] font-medium text-sky-100">{language === 'ru' ? 'Звук выкл' : 'Deafened'}</span> : null}
                    {selectedManagedMember.moderation?.isScreenShareBlocked ? <span className="rounded-full bg-fuchsia-500/12 px-2.5 py-1 text-[11px] font-medium text-fuchsia-100">{language === 'ru' ? 'Без демонстрации' : 'No share'}</span> : null}
                    {selectedManagedMember.moderation?.isBanned ? <span className="rounded-full bg-red-500/12 px-2.5 py-1 text-[11px] font-medium text-red-100">{language === 'ru' ? 'Бан активен' : 'Banned'}</span> : null}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-left text-sm text-slate-200" type="button" onClick={() => void onModerateMember(selectedManagedMember.userId, 'mute', 10)}>{language === 'ru' ? 'Микрофон 10м' : 'Mute 10m'}</button>
                    <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-left text-sm text-slate-200" type="button" onClick={() => void onModerateMember(selectedManagedMember.userId, 'deafen', 10)}>{language === 'ru' ? 'Звук 10м' : 'Deafen 10m'}</button>
                    <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-left text-sm text-slate-200" type="button" onClick={() => void onModerateMember(selectedManagedMember.userId, 'block_share', 30)}>{language === 'ru' ? 'Запретить показ 30м' : 'Block share 30m'}</button>
                    <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-left text-sm text-slate-200" type="button" onClick={() => void onModerateMember(selectedManagedMember.userId, 'ban', 60)}>{language === 'ru' ? 'Бан 1ч' : 'Ban 1h'}</button>
                  </div>
                  {(selectedManagedMember.moderation?.isMuted || selectedManagedMember.moderation?.isDeafened || selectedManagedMember.moderation?.isScreenShareBlocked || selectedManagedMember.moderation?.isBanned) ? (
                    <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-left text-sm text-slate-200" type="button" onClick={() => void onClearMemberRestrictions(selectedManagedMember.userId)}>{language === 'ru' ? 'Снять ограничения' : 'Clear restrictions'}</button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
