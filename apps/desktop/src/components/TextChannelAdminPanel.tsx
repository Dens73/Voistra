import type { FormEvent } from 'react';

import { ActionIcon, UserIdentity } from './app-primitives';
import type { Language, ServerPanelTab } from '../app/types';
import type { Channel, Server, ServerMember } from '../types';

type ChannelDraft = {
  name: string;
  isPrivate: boolean;
  password: string;
};

type CreateChannelFormState = {
  name: string;
  type: 'text' | 'voice';
  isPrivate: boolean;
  password: string;
};

type ServerSettingsFormState = {
  name: string;
  description: string;
};

type TextChannelAdminPanelStrings = {
  channels: string;
  channelPassword: string;
  copyId: string;
  createChannel: string;
  general: string;
  members: string;
  membersTab: string;
  openDialog: string;
  overviewTab: string;
  owner: string;
  privateChannel: string;
  saveServer: string;
  serverOverview: string;
  serverSettings: string;
  settingsTab: string;
  text: string;
  unknownUser: string;
  updateDescription: string;
  updateServerName: string;
  voice: string;
};

type TextChannelAdminPanelProps = {
  i18n: TextChannelAdminPanelStrings;
  language: Language;
  userId: string;
  canManageServer: boolean;
  canCreateChannel: boolean;
  selectedServer: Server | null;
  serverMembers: ServerMember[];
  serverPanelTab: ServerPanelTab;
  selectedMemberActionUserId: string;
  createChannelForm: CreateChannelFormState;
  serverSettingsForm: ServerSettingsFormState;
  channelSettingsDrafts: Record<string, ChannelDraft>;
  channels: Channel[];
  onSetServerPanelTab: (tab: ServerPanelTab) => void;
  onSetSelectedMemberActionUserId: (updater: string | ((current: string) => string)) => void;
  onSetCreateChannelForm: (updater: (current: CreateChannelFormState) => CreateChannelFormState) => void;
  onSetServerSettingsForm: (updater: (current: ServerSettingsFormState) => ServerSettingsFormState) => void;
  onSetChannelSettingsDrafts: (
    updater: (current: Record<string, ChannelDraft>) => Record<string, ChannelDraft>,
  ) => void;
  onCopy: (value: string, label: string) => void;
  onOpenConversation: (userId: string) => void;
  onModerateMember: (
    memberUserId: string,
    action:
      | 'mute'
      | 'deafen'
      | 'block_share'
      | 'ban'
      | 'clear_mute'
      | 'clear_deafen'
      | 'clear_block_share'
      | 'clear_ban',
    durationMinutes?: number,
  ) => void;
  onClearMemberRestrictions: (memberUserId: string) => void;
  onRemoveMember: (memberUserId: string) => void;
  onCreateChannel: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateServer: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateChannel: (channelId: string) => void;
  onRemoveSpecificChannel: (channelId: string) => void;
  roleLabel: (role?: string) => string;
};

export function TextChannelAdminPanel({
  i18n,
  language,
  userId,
  canManageServer,
  canCreateChannel,
  selectedServer,
  serverMembers,
  serverPanelTab,
  selectedMemberActionUserId,
  createChannelForm,
  serverSettingsForm,
  channelSettingsDrafts,
  channels,
  onSetServerPanelTab,
  onSetSelectedMemberActionUserId,
  onSetCreateChannelForm,
  onSetServerSettingsForm,
  onSetChannelSettingsDrafts,
  onCopy,
  onOpenConversation,
  onModerateMember,
  onClearMemberRestrictions,
  onRemoveMember,
  onCreateChannel,
  onUpdateServer,
  onUpdateChannel,
  onRemoveSpecificChannel,
  roleLabel,
}: TextChannelAdminPanelProps) {
  return (
    <aside className="rounded-[28px] border border-white/6 bg-[#171a1d] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.22)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{i18n.serverOverview}</h3>
          <p className="text-sm text-slate-500">{roleLabel(selectedServer?.currentUserRole)}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className={serverPanelTab === 'overview'
            ? 'rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white'
            : 'rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-300'}
          type="button"
          onClick={() => onSetServerPanelTab('overview')}
        >
          {i18n.overviewTab}
        </button>
        <button
          className={serverPanelTab === 'members'
            ? 'rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white'
            : 'rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-300'}
          type="button"
          onClick={() => onSetServerPanelTab('members')}
        >
          {i18n.membersTab}
        </button>
        <button
          className={serverPanelTab === 'settings'
            ? 'rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white'
            : 'rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-300'}
          type="button"
          onClick={() => onSetServerPanelTab('settings')}
        >
          {i18n.settingsTab}
        </button>
      </div>

      {serverPanelTab === 'overview' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/6 bg-white/[0.03] p-4">
            <span className="block text-xs text-slate-500">{i18n.owner}</span>
            <strong className="mt-2 block text-white">{selectedServer?.owner?.displayName ?? i18n.unknownUser}</strong>
          </div>
          <div className="rounded-3xl border border-white/6 bg-white/[0.03] p-4">
            <span className="block text-xs text-slate-500">{i18n.members}</span>
            <strong className="mt-2 block text-white">{selectedServer?.memberCount ?? 0}</strong>
          </div>
        </div>
      ) : null}

      {serverPanelTab === 'members' ? (
        <div className="grid gap-3">
          {serverMembers.map((member) => (
            <div key={member.id} className="rounded-3xl border border-white/6 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <UserIdentity
                  displayName={member.user?.displayName ?? member.user?.username ?? member.userId}
                  username={member.user?.username ?? i18n.unknownUser}
                  subtitle={`@${member.user?.username ?? i18n.unknownUser}`}
                  compact
                />
                <button
                  className="inline-grid h-10 w-10 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300"
                  type="button"
                  onClick={() =>
                    onSetSelectedMemberActionUserId((current) => (current === member.userId ? '' : member.userId))
                  }
                >
                  <ActionIcon kind="more" />
                </button>
              </div>

              {member.moderation ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {member.moderation.isMuted ? <span className="rounded-full bg-amber-500/12 px-2.5 py-1 text-[11px] font-medium text-amber-100">{language === 'ru' ? 'Микрофон выкл' : 'Muted'}</span> : null}
                  {member.moderation.isDeafened ? <span className="rounded-full bg-sky-500/12 px-2.5 py-1 text-[11px] font-medium text-sky-100">{language === 'ru' ? 'Звук выкл' : 'Deafened'}</span> : null}
                  {member.moderation.isScreenShareBlocked ? <span className="rounded-full bg-fuchsia-500/12 px-2.5 py-1 text-[11px] font-medium text-fuchsia-100">{language === 'ru' ? 'Без демонстрации' : 'No share'}</span> : null}
                  {member.moderation.isBanned ? <span className="rounded-full bg-red-500/12 px-2.5 py-1 text-[11px] font-medium text-red-100">{language === 'ru' ? 'Бан активен' : 'Banned'}</span> : null}
                </div>
              ) : null}

              {selectedMemberActionUserId === member.userId ? (
                <div className="mt-3 grid gap-2">
                  <button
                    className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-left text-sm text-slate-200"
                    type="button"
                    onClick={() => onCopy(member.userId, i18n.copyId)}
                  >
                    {i18n.copyId}
                  </button>
                  {member.userId !== userId ? (
                    <button
                      className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-left text-sm text-slate-200"
                      type="button"
                      onClick={() => onOpenConversation(member.userId)}
                    >
                      {i18n.openDialog}
                    </button>
                  ) : null}
                  {canManageServer && !member.isOwner && member.userId !== userId ? (
                    <>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-left text-sm text-slate-200" type="button" onClick={() => onModerateMember(member.userId, 'mute', 10)}>{language === 'ru' ? 'Микрофон 10м' : 'Mute 10m'}</button>
                        <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-left text-sm text-slate-200" type="button" onClick={() => onModerateMember(member.userId, 'deafen', 10)}>{language === 'ru' ? 'Звук 10м' : 'Deafen 10m'}</button>
                        <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-left text-sm text-slate-200" type="button" onClick={() => onModerateMember(member.userId, 'block_share', 30)}>{language === 'ru' ? 'Запретить показ 30м' : 'Block share 30m'}</button>
                        <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-left text-sm text-slate-200" type="button" onClick={() => onModerateMember(member.userId, 'ban', 60)}>{language === 'ru' ? 'Бан 1ч' : 'Ban 1h'}</button>
                      </div>
                      {member.moderation && (member.moderation.isMuted || member.moderation.isDeafened || member.moderation.isScreenShareBlocked || member.moderation.isBanned) ? (
                        <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-left text-sm text-slate-200" type="button" onClick={() => onClearMemberRestrictions(member.userId)}>{language === 'ru' ? 'Снять ограничения' : 'Clear restrictions'}</button>
                      ) : null}
                    </>
                  ) : null}
                  {canManageServer && !member.isOwner && member.userId !== userId ? (
                    <button
                      className="rounded-2xl border border-red-400/16 bg-red-500/10 px-4 py-2 text-left text-sm font-medium text-red-200"
                      type="button"
                      onClick={() => onRemoveMember(member.userId)}
                    >
                      {language === 'ru' ? 'Удалить с сервера' : 'Remove from server'}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {serverPanelTab === 'settings' && canManageServer && selectedServer ? (
        <div className="grid gap-4">
          {canCreateChannel ? (
            <form className="grid gap-3 rounded-3xl border border-white/6 bg-white/[0.03] p-4" onSubmit={onCreateChannel}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-white">{i18n.createChannel}</h4>
                  <p className="text-xs text-slate-500">{i18n.text} / {i18n.voice}</p>
                </div>
              </div>
              <input
                className="h-11 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none"
                value={createChannelForm.name}
                onChange={(event) => onSetCreateChannelForm((current) => ({ ...current, name: event.target.value }))}
                placeholder={i18n.general}
                required
              />
              <select
                className="h-11 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none"
                value={createChannelForm.type}
                onChange={(event) =>
                  onSetCreateChannelForm((current) => ({
                    ...current,
                    type: event.target.value as 'text' | 'voice',
                  }))
                }
              >
                <option value="text">{i18n.text}</option>
                <option value="voice">{i18n.voice}</option>
              </select>
              <label className="flex items-center gap-3 rounded-2xl border border-white/6 bg-black/10 px-4 py-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={createChannelForm.isPrivate}
                  onChange={(event) =>
                    onSetCreateChannelForm((current) => ({
                      ...current,
                      isPrivate: event.target.checked,
                      password: event.target.checked ? current.password : '',
                    }))
                  }
                />
                {i18n.privateChannel}
              </label>
              {createChannelForm.isPrivate ? (
                <input
                  className="h-11 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none"
                  type="password"
                  value={createChannelForm.password}
                  onChange={(event) => onSetCreateChannelForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder={i18n.channelPassword}
                />
              ) : null}
              <button className="h-11 rounded-2xl bg-emerald-500 px-4 text-sm font-semibold text-white" type="submit" disabled={!selectedServer.id || !canCreateChannel}>
                {i18n.createChannel}
              </button>
            </form>
          ) : null}

          <form className="grid gap-3 rounded-3xl border border-white/6 bg-white/[0.03] p-4" onSubmit={onUpdateServer}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-white">{i18n.serverSettings}</h4>
                <p className="text-xs text-slate-500">ID: {selectedServer.id}</p>
              </div>
            </div>
            <input className="h-11 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none" value={serverSettingsForm.name} onChange={(event) => onSetServerSettingsForm((current) => ({ ...current, name: event.target.value }))} placeholder={i18n.updateServerName} />
            <input className="h-11 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none" value={serverSettingsForm.description} onChange={(event) => onSetServerSettingsForm((current) => ({ ...current, description: event.target.value }))} placeholder={i18n.updateDescription} />
            <button className="h-11 rounded-2xl bg-emerald-500 px-4 text-sm font-semibold text-white" type="submit">{i18n.saveServer}</button>
          </form>

          <div className="grid gap-3 rounded-3xl border border-white/6 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-white">{i18n.channels}</h4>
                <p className="text-xs text-slate-500">{channels.length}</p>
              </div>
            </div>
            <div className="grid gap-3">
              {channels.map((channel) => {
                const draft = channelSettingsDrafts[channel.id] ?? {
                  name: channel.name,
                  isPrivate: channel.isPrivate,
                  password: '',
                };

                return (
                  <div key={channel.id} className="grid gap-3 rounded-3xl border border-white/6 bg-[#121417] p-4">
                    <input
                      className="h-11 rounded-2xl border border-white/6 bg-black/10 px-4 text-slate-100 outline-none"
                      value={draft.name}
                      onChange={(event) =>
                        onSetChannelSettingsDrafts((current) => ({
                          ...current,
                          [channel.id]: { ...draft, name: event.target.value },
                        }))
                      }
                    />
                    <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                      <span>{channel.type === 'text' ? i18n.text : i18n.voice}</span>
                      <span>ID: {channel.id}</span>
                    </div>
                    <label className="flex items-center gap-3 rounded-2xl border border-white/6 bg-black/10 px-4 py-3 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={draft.isPrivate}
                        onChange={(event) =>
                          onSetChannelSettingsDrafts((current) => ({
                            ...current,
                            [channel.id]: {
                              ...draft,
                              isPrivate: event.target.checked,
                              password: event.target.checked ? draft.password : '',
                            },
                          }))
                        }
                      />
                      {i18n.privateChannel}
                    </label>
                    {draft.isPrivate ? (
                      <input
                        className="h-11 rounded-2xl border border-white/6 bg-black/10 px-4 text-slate-100 outline-none"
                        type="password"
                        value={draft.password}
                        onChange={(event) =>
                          onSetChannelSettingsDrafts((current) => ({
                            ...current,
                            [channel.id]: { ...draft, password: event.target.value },
                          }))
                        }
                        placeholder={i18n.channelPassword}
                      />
                    ) : null}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button className="h-11 rounded-2xl border border-white/6 bg-white/[0.03] px-4 text-sm font-medium text-slate-200" type="button" onClick={() => onUpdateChannel(channel.id)}>
                        {language === 'ru' ? 'Обновить канал' : 'Update channel'}
                      </button>
                      <button className="h-11 rounded-2xl border border-red-400/16 bg-red-500/10 px-4 text-sm font-medium text-red-200" type="button" onClick={() => onRemoveSpecificChannel(channel.id)}>
                        {language === 'ru' ? 'Удалить канал' : 'Delete channel'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
