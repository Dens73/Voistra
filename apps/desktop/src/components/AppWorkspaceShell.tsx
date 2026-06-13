import type { ChangeEvent, ReactNode, RefObject } from 'react';

import { NotificationCenter } from './NotificationCenter';
import { ActionIcon, ChannelGlyph, ProfileAvatar } from './app-primitives';
import { AccessBadge } from '../app/app-ui';
import type { Channel, DirectConversation, Server } from '../types';
import type { AppNotification, AuthUser, ConnectedVoiceSession, Language, WorkspaceMode } from '../app/types';

type AppWorkspaceShellStrings = {
  chooseChannel: string;
  copied: string;
  directMessages: string;
  friendsTab: string;
  members: string;
  messages: string;
  newServer: string;
  profileSettings: string;
  profileTab: string;
  serverId: string;
  serversTab: string;
  settingsTab: string;
  textChannels: string;
  voiceChannels: string;
};

type AppWorkspaceShellProps = {
  adminPanelOpen: boolean;
  avatarInputRef: RefObject<HTMLInputElement | null>;
  channelPanelOpen: boolean;
  connectedVoiceSession: ConnectedVoiceSession | null;
  conversationsCount: number;
  error: string;
  i18n: AppWorkspaceShellStrings;
  language: Language;
  notifications: AppNotification[];
  notificationCenterOpen: boolean;
  railActiveServerId?: string;
  selectedChannel: Channel | null;
  selectedChannelId: string;
  selectedConversation: DirectConversation | null;
  selectedServer: Server | null;
  serverDirectoryOpen: boolean;
  servers: Server[];
  shellUser: AuthUser;
  showChannelSidebar: boolean;
  status: string;
  textChannels: Channel[];
  toast: string;
  user: AuthUser;
  voiceChannels: Channel[];
  voiceFlags: {
    muted: boolean;
    deafened: boolean;
  };
  workspaceMode: WorkspaceMode;
  workspaceContent: ReactNode;
  onAvatarFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearNotifications: () => void;
  onCopy: (value: string, label: string) => void;
  onOpenFriends: () => void;
  onOpenProfile: () => void;
  onOpenServerModal: () => void;
  onSelectChannel: (channel: Channel) => void;
  onSelectServer: (serverId: string) => void;
  onToggleAdminPanel: () => void;
  onToggleChannelPanel: () => void;
  onToggleDeafen: () => void;
  onToggleMute: () => void;
  onToggleNotificationCenter: () => void;
  onToggleServerDirectory: (open?: boolean) => void;
};

export function AppWorkspaceShell({
  adminPanelOpen,
  avatarInputRef,
  channelPanelOpen,
  connectedVoiceSession,
  conversationsCount,
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
  shellUser,
  showChannelSidebar,
  status,
  textChannels,
  toast,
  user,
  voiceChannels,
  voiceFlags,
  workspaceMode,
  workspaceContent,
  onAvatarFileChange,
  onClearNotifications,
  onCopy,
  onOpenFriends,
  onOpenProfile,
  onOpenServerModal,
  onSelectChannel,
  onSelectServer,
  onToggleAdminPanel,
  onToggleChannelPanel,
  onToggleDeafen,
  onToggleMute,
  onToggleNotificationCenter,
  onToggleServerDirectory,
}: AppWorkspaceShellProps) {
  const serverDrawerWidth = serverDirectoryOpen ? 248 : 16;
  const secondarySidebarWidth = workspaceMode === 'servers' ? 288 : 0;
  const effectiveChannelSidebarWidth = showChannelSidebar ? secondarySidebarWidth : 0;
  const shellPaddingLeft = 24 + serverDrawerWidth + (effectiveChannelSidebarWidth > 0 ? effectiveChannelSidebarWidth + 24 : 0);

  return (
    <div className="min-h-screen bg-[#0b0f12] text-slate-100">
      {!serverDirectoryOpen ? (
        <div className="fixed inset-y-0 left-0 z-[70] w-6" onMouseEnter={() => onToggleServerDirectory(true)} aria-hidden="true" />
      ) : null}

      <aside
        className="fixed inset-y-0 left-0 z-[80] overflow-hidden border-r border-white/6 bg-[#0f1417]/95 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl transition-[width] duration-200"
        style={{ width: serverDrawerWidth }}
        onMouseEnter={() => onToggleServerDirectory(true)}
        onMouseLeave={() => onToggleServerDirectory(false)}
      >
        {!serverDirectoryOpen ? (
          <div className="absolute left-[5px] top-10 bottom-10 w-[4px] rounded-full bg-emerald-300/60 shadow-[0_0_16px_rgba(52,211,153,0.3)]" />
        ) : null}

        <div className={serverDirectoryOpen ? 'flex h-full min-w-[248px] flex-col gap-4 p-4 opacity-100 transition-opacity duration-150' : 'pointer-events-none flex h-full min-w-[248px] flex-col gap-4 p-4 opacity-0'}>
          <div className="rounded-[24px] border border-white/6 bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-3">
              <ProfileAvatar user={shellUser} />
              <div className="min-w-0">
                <strong className="block truncate text-sm font-semibold text-white">{user.displayName}</strong>
                <span className="block truncate text-xs text-slate-500">@{user.username}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                className={workspaceMode === 'friends' ? 'flex-1 rounded-2xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white' : 'flex-1 rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/[0.06]'}
                type="button"
                onClick={onOpenFriends}
              >
                {i18n.friendsTab}
              </button>
              <button
                className={workspaceMode === 'profile' ? 'inline-grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500 text-white' : 'inline-grid h-11 w-11 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'}
                type="button"
                onClick={onOpenProfile}
                title={i18n.profileTab}
              >
                <ActionIcon kind="settings" />
              </button>
            </div>
            <div className="mt-3 inline-flex rounded-2xl border border-white/6 bg-[#121417] p-1">
              <button className={language === 'ru' ? 'rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white' : 'rounded-xl px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:text-white'} type="button">
                RU
              </button>
              <button className={language === 'en' ? 'rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white' : 'rounded-xl px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:text-white'} type="button">
                EN
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{i18n.serversTab}</span>
            <button
              className="inline-grid h-9 w-9 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              type="button"
              onClick={onOpenServerModal}
              title={i18n.newServer}
            >
              <ActionIcon kind="plus" />
            </button>
          </div>

          <div className="grid gap-3 overflow-y-auto pr-1">
            {servers.map((server) => (
              <button
                key={server.id}
                className={server.id === railActiveServerId ? 'grid gap-1 rounded-[22px] border border-emerald-300/16 bg-emerald-400/12 p-3.5 text-left shadow-[0_18px_36px_rgba(16,185,129,0.12)]' : 'grid gap-1 rounded-[22px] border border-white/6 bg-white/[0.03] p-3.5 text-left transition hover:bg-white/[0.05]'}
                type="button"
                onClick={() => onSelectServer(server.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.06] text-sm font-semibold text-emerald-100">
                    {server.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <strong className="block truncate text-sm font-semibold text-white">{server.name}</strong>
                    <span className="block truncate text-xs text-slate-500">{server.memberCount} {i18n.members}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {showChannelSidebar && selectedServer ? (
        <aside
          className="fixed top-5 bottom-5 z-[60] w-[288px] overflow-hidden rounded-[28px] border border-white/6 bg-[#151a1d]/96 p-4 shadow-[0_28px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl"
          style={{ left: serverDrawerWidth + 24 }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex rounded-full bg-emerald-400/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-100">{selectedServer.name}</span>
              <h2 className="mt-4 truncate text-[20px] font-semibold text-white">{selectedChannel?.name ?? i18n.chooseChannel}</h2>
              <button
                className="mt-3 rounded-full border border-white/6 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-emerald-300/18 hover:text-slate-200"
                type="button"
                onClick={() => onCopy(selectedServer.id, i18n.serverId)}
              >
                ID: {selectedServer.id}
              </button>
              <button
                className={adminPanelOpen ? 'mt-3 block rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-white' : 'mt-3 block rounded-full border border-white/6 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06]'}
                type="button"
                onClick={onToggleAdminPanel}
              >
                {language === 'ru' ? 'Управление сервером' : 'Manage server'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="inline-grid h-10 w-10 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.06]"
                type="button"
                onClick={onToggleChannelPanel}
                title={language === 'ru' ? 'Скрыть каналы' : 'Hide channels'}
              >
                <ActionIcon kind="menu" />
              </button>
              <button
                className={adminPanelOpen ? 'inline-grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500 text-white' : 'inline-grid h-10 w-10 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.06]'}
                type="button"
                onClick={onToggleAdminPanel}
                title={i18n.settingsTab}
              >
                <ActionIcon kind="settings" />
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-5 overflow-y-auto pr-1">
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <strong className="text-sm font-semibold text-white">{i18n.textChannels}</strong>
                <span className="text-xs text-slate-500">{textChannels.length}</span>
              </div>
              {textChannels.map((channel) => (
                <button
                  key={channel.id}
                  className={channel.id === selectedChannelId ? 'grid gap-1 rounded-[20px] border border-emerald-300/16 bg-emerald-400/10 p-3.5 text-left' : 'grid gap-1 rounded-[20px] border border-white/6 bg-white/[0.03] p-3.5 text-left transition hover:bg-white/[0.05]'}
                  type="button"
                  onClick={() => onSelectChannel(channel)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong className="flex items-center gap-2 text-sm font-semibold text-white">
                      <ChannelGlyph type={channel.type} /> {channel.name}
                    </strong>
                    <AccessBadge isPrivate={channel.isPrivate} language={language} />
                  </div>
                </button>
              ))}
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <strong className="text-sm font-semibold text-white">{i18n.voiceChannels}</strong>
                <span className="text-xs text-slate-500">{voiceChannels.length}</span>
              </div>
              {voiceChannels.map((channel) => (
                <button
                  key={channel.id}
                  className={channel.id === selectedChannelId ? 'grid gap-1 rounded-[20px] border border-emerald-300/16 bg-emerald-400/10 p-3.5 text-left' : 'grid gap-1 rounded-[20px] border border-white/6 bg-white/[0.03] p-3.5 text-left transition hover:bg-white/[0.05]'}
                  type="button"
                  onClick={() => onSelectChannel(channel)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong className="flex items-center gap-2 text-sm font-semibold text-white">
                      <ChannelGlyph type={channel.type} /> {channel.name}
                    </strong>
                    <AccessBadge isPrivate={channel.isPrivate} language={language} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      ) : null}

      <div className="min-h-screen px-5 py-5 transition-[padding] duration-200" style={{ paddingLeft: shellPaddingLeft }}>
        <div className="grid gap-5">
          <header className="flex items-center justify-between rounded-[24px] border border-white/6 bg-[#151a1d] px-5 py-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)]">
            <div className="min-w-0">
              <span className="inline-flex rounded-full bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {workspaceMode === 'servers' ? (selectedServer?.name ?? i18n.serversTab) : workspaceMode === 'friends' ? i18n.friendsTab : i18n.profileTab}
              </span>
              <h1 className="mt-2 truncate text-[22px] font-semibold text-white">
                {workspaceMode === 'servers'
                  ? selectedChannel?.name ?? selectedServer?.name ?? i18n.chooseChannel
                  : workspaceMode === 'friends'
                    ? selectedConversation?.participant?.displayName ?? i18n.directMessages
                    : i18n.profileSettings}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {connectedVoiceSession ? `${language === 'ru' ? 'В голосе' : 'In voice'}: ${connectedVoiceSession.channelName}` : status}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter
                language={language}
                notifications={notifications}
                open={notificationCenterOpen}
                onClear={onClearNotifications}
                onToggle={onToggleNotificationCenter}
              />
              {workspaceMode === 'servers' ? (
                <>
                  <button className={serverDirectoryOpen ? 'inline-grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500 text-white' : 'inline-grid h-11 w-11 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'} type="button" onClick={() => onToggleServerDirectory()}>
                    <ActionIcon kind="panel" />
                  </button>
                  <button className={showChannelSidebar ? 'inline-grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500 text-white' : 'inline-grid h-11 w-11 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'} type="button" onClick={onToggleChannelPanel}>
                    <ActionIcon kind="menu" />
                  </button>
                  <button className={adminPanelOpen ? 'inline-grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500 text-white' : 'inline-grid h-11 w-11 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'} type="button" onClick={onToggleAdminPanel}>
                    <ActionIcon kind="settings" />
                  </button>
                </>
              ) : null}
            </div>
          </header>

          <input
            ref={avatarInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            style={{ display: 'none' }}
            onChange={(event) => void onAvatarFileChange(event)}
          />

          {workspaceContent}

          {error ? <div className="rounded-2xl border border-red-400/16 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">{error}</div> : null}
        </div>
      </div>

      {toast ? <div className="fixed bottom-6 right-6 z-[90] rounded-2xl border border-emerald-300/14 bg-[#151c1c] px-4 py-3 text-sm font-semibold text-emerald-50 shadow-[0_20px_48px_rgba(0,0,0,0.36)]">{toast}</div> : null}
    </div>
  );
}
