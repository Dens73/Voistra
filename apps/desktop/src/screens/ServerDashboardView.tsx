import type { Dispatch, FormEvent, SetStateAction } from 'react';

import type { Channel, Server } from '../types';

import { ActionIcon, ChannelGlyph } from '../components/app-primitives';

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

type ChannelDraftState = Record<string, {
  name: string;
  isPrivate: boolean;
  password: string;
}>;

type ServerDashboardStrings = {
  channelPassword: string;
  createChannel: string;
  general: string;
  noDescription: string;
  privateChannel: string;
  saveServer: string;
  selectChannelBegin: string;
  selectChannelHelp: string;
  serverSettings: string;
  text: string;
  updateDescription: string;
  updateServerName: string;
  voice: string;
};

type ServerDashboardViewProps = {
  adminPanelOpen: boolean;
  canCreateChannel: boolean;
  canManageServer: boolean;
  channelSettingsDrafts: ChannelDraftState;
  channels: Channel[];
  createChannelForm: CreateChannelFormState;
  i18n: ServerDashboardStrings;
  language: 'ru' | 'en';
  selectedServer: Server | null;
  selectedServerId: string;
  serverSettingsForm: ServerSettingsFormState;
  textChannels: Channel[];
  voiceChannels: Channel[];
  onChannelSettingsDraftsChange: Dispatch<SetStateAction<ChannelDraftState>>;
  onCloseAdminPanel: () => void;
  onCreateChannel: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onCreateChannelFormChange: Dispatch<SetStateAction<CreateChannelFormState>>;
  onOpenAdminPanel: () => void;
  onRemoveChannel: (channelId: string) => void | Promise<void>;
  onSelectChannel: (channel: Channel) => void | Promise<void>;
  onServerSettingsFormChange: Dispatch<SetStateAction<ServerSettingsFormState>>;
  onUpdateChannel: (channelId: string) => void | Promise<void>;
  onUpdateServer: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
};

export function ServerDashboardView({
  adminPanelOpen,
  canCreateChannel,
  canManageServer,
  channelSettingsDrafts,
  channels,
  createChannelForm,
  i18n,
  language,
  selectedServer,
  selectedServerId,
  serverSettingsForm,
  textChannels,
  voiceChannels,
  onChannelSettingsDraftsChange,
  onCloseAdminPanel,
  onCreateChannel,
  onCreateChannelFormChange,
  onOpenAdminPanel,
  onRemoveChannel,
  onSelectChannel,
  onServerSettingsFormChange,
  onUpdateChannel,
  onUpdateServer,
}: ServerDashboardViewProps) {
  if (!selectedServer) {
    return (
      <section className="rounded-[28px] border border-white/6 bg-[#171a1d] p-6 shadow-[0_20px_48px_rgba(0,0,0,0.22)]">
        <h3 className="text-2xl font-semibold text-white">{i18n.selectChannelBegin}</h3>
        <p className="mt-2 text-sm text-slate-500">{i18n.selectChannelHelp}</p>
      </section>
    );
  }

  if (adminPanelOpen && canManageServer) {
    return (
      <section className="rounded-[28px] border border-white/6 bg-[#171a1d] p-6 shadow-[0_20px_48px_rgba(0,0,0,0.22)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-2xl font-semibold text-white">{language === 'ru' ? 'Управление сервером' : 'Manage server'}</h3>
            <p className="mt-2 text-sm text-slate-500">{selectedServer.name}</p>
          </div>
          <button
            className="inline-grid h-10 w-10 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.06]"
            type="button"
            onClick={onCloseAdminPanel}
            title={language === 'ru' ? 'Закрыть' : 'Close'}
          >
            <ActionIcon kind="close" />
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {canCreateChannel ? (
            <form className="grid gap-3 rounded-3xl border border-white/6 bg-[#121417] p-4" onSubmit={onCreateChannel}>
              <h4 className="text-sm font-semibold text-white">{i18n.createChannel}</h4>
              <input
                className="h-10 rounded-2xl border border-white/6 bg-black/10 px-3 text-sm text-slate-100 outline-none"
                value={createChannelForm.name}
                onChange={(event) => onCreateChannelFormChange((current) => ({ ...current, name: event.target.value }))}
                placeholder={i18n.general}
                required
              />
              <select
                className="h-10 rounded-2xl border border-white/6 bg-black/10 px-3 text-sm text-slate-100 outline-none"
                value={createChannelForm.type}
                onChange={(event) =>
                  onCreateChannelFormChange((current) => ({
                    ...current,
                    type: event.target.value as 'text' | 'voice',
                  }))
                }
              >
                <option value="text">{i18n.text}</option>
                <option value="voice">{i18n.voice}</option>
              </select>
              <label className="flex items-center gap-3 rounded-2xl border border-white/6 bg-black/10 px-3 py-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={createChannelForm.isPrivate}
                  onChange={(event) =>
                    onCreateChannelFormChange((current) => ({
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
                  className="h-10 rounded-2xl border border-white/6 bg-black/10 px-3 text-sm text-slate-100 outline-none"
                  type="password"
                  value={createChannelForm.password}
                  onChange={(event) => onCreateChannelFormChange((current) => ({ ...current, password: event.target.value }))}
                  placeholder={i18n.channelPassword}
                />
              ) : null}
              <button className="h-10 rounded-2xl bg-emerald-500 px-3 text-sm font-semibold text-white" type="submit" disabled={!selectedServerId}>
                {i18n.createChannel}
              </button>
            </form>
          ) : null}

          <form className="grid gap-3 rounded-3xl border border-white/6 bg-[#121417] p-4" onSubmit={onUpdateServer}>
            <h4 className="text-sm font-semibold text-white">{i18n.serverSettings}</h4>
            <input
              className="h-10 rounded-2xl border border-white/6 bg-black/10 px-3 text-sm text-slate-100 outline-none"
              value={serverSettingsForm.name}
              onChange={(event) => onServerSettingsFormChange((current) => ({ ...current, name: event.target.value }))}
              placeholder={i18n.updateServerName}
            />
            <input
              className="h-10 rounded-2xl border border-white/6 bg-black/10 px-3 text-sm text-slate-100 outline-none"
              value={serverSettingsForm.description}
              onChange={(event) => onServerSettingsFormChange((current) => ({ ...current, description: event.target.value }))}
              placeholder={i18n.updateDescription}
            />
            <button className="h-10 rounded-2xl bg-emerald-500 px-3 text-sm font-semibold text-white" type="submit">
              {i18n.saveServer}
            </button>
          </form>
        </div>

        <div className="mt-4 grid gap-3 rounded-3xl border border-white/6 bg-[#121417] p-3">
          <h5 className="text-sm font-semibold text-white">{language === 'ru' ? 'Каналы' : 'Channels'}</h5>
          {channels.map((channel) => {
            const draft = channelSettingsDrafts[channel.id] ?? {
              name: channel.name,
              isPrivate: channel.isPrivate,
              password: '',
            };

            return (
              <div key={`dashboard-channel-${channel.id}`} className="grid gap-3 rounded-3xl border border-white/6 bg-black/10 p-3">
                <input
                  className="h-10 rounded-2xl border border-white/6 bg-black/10 px-3 text-sm text-slate-100 outline-none"
                  value={draft.name}
                  onChange={(event) =>
                    onChannelSettingsDraftsChange((current) => ({
                      ...current,
                      [channel.id]: { ...draft, name: event.target.value },
                    }))
                  }
                />
                <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span>{channel.type === 'text' ? i18n.text : i18n.voice}</span>
                  <span>ID: {channel.id}</span>
                </div>
                <label className="flex items-center gap-3 rounded-2xl border border-white/6 bg-black/10 px-3 py-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={draft.isPrivate}
                    onChange={(event) =>
                      onChannelSettingsDraftsChange((current) => ({
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
                    className="h-10 rounded-2xl border border-white/6 bg-black/10 px-3 text-sm text-slate-100 outline-none"
                    type="password"
                    value={draft.password}
                    onChange={(event) =>
                      onChannelSettingsDraftsChange((current) => ({
                        ...current,
                        [channel.id]: { ...draft, password: event.target.value },
                      }))
                    }
                    placeholder={i18n.channelPassword}
                  />
                ) : null}
                <div className="grid gap-2 sm:grid-cols-2">
                  <button className="h-10 rounded-2xl border border-white/6 bg-white/[0.03] px-3 text-sm font-medium text-slate-200" type="button" onClick={() => void onUpdateChannel(channel.id)}>
                    {language === 'ru' ? 'Обновить канал' : 'Update channel'}
                  </button>
                  <button className="h-10 rounded-2xl border border-red-400/16 bg-red-500/10 px-3 text-sm font-medium text-red-200" type="button" onClick={() => void onRemoveChannel(channel.id)}>
                    {language === 'ru' ? 'Удалить канал' : 'Delete channel'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-white/6 bg-[#171a1d] p-6 shadow-[0_20px_48px_rgba(0,0,0,0.22)]">
      <h3 className="text-2xl font-semibold text-white">{selectedServer.name}</h3>
      <p className="mt-2 text-sm text-slate-500">{selectedServer.description || i18n.noDescription}</p>
      {canManageServer ? (
        <button
          className="mt-5 h-11 rounded-2xl bg-emerald-500 px-4 text-sm font-semibold text-white"
          type="button"
          onClick={onOpenAdminPanel}
        >
          {language === 'ru' ? 'Управление сервером' : 'Manage server'}
        </button>
      ) : null}

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/6 bg-[#121417] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-white">{language === 'ru' ? 'Текстовые каналы' : 'Text channels'}</h4>
            <span className="text-xs text-slate-500">{textChannels.length}</span>
          </div>
          <div className="grid gap-2">
            {textChannels.length > 0 ? textChannels.map((channel) => (
              <button key={channel.id} className="list-item" type="button" onClick={() => void onSelectChannel(channel)}>
                <strong><ChannelGlyph type={channel.type} /> {channel.name}</strong>
              </button>
            )) : (
              <div className="list-item">
                <span>{language === 'ru' ? 'Текстовых каналов пока нет.' : 'No text channels yet.'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/6 bg-[#121417] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-white">{language === 'ru' ? 'Голосовые каналы' : 'Voice channels'}</h4>
            <span className="text-xs text-slate-500">{voiceChannels.length}</span>
          </div>
          <div className="grid gap-2">
            {voiceChannels.length > 0 ? voiceChannels.map((channel) => (
              <button key={channel.id} className="list-item" type="button" onClick={() => void onSelectChannel(channel)}>
                <strong><ChannelGlyph type={channel.type} /> {channel.name}</strong>
              </button>
            )) : (
              <div className="list-item">
                <span>{language === 'ru' ? 'Голосовых каналов пока нет.' : 'No voice channels yet.'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
