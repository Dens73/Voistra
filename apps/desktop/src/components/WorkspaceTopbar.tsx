import type { Channel, DirectConversation, Server } from '../types';
import type { ConnectedVoiceSession, Language, WorkspaceMode } from '../app/types';

import { ActionIcon } from './app-primitives';

type WorkspaceTopbarProps = {
  adminPanelOpen: boolean;
  channelPanelOpen: boolean;
  connectedVoiceSession: ConnectedVoiceSession | null;
  i18n: {
    channels: string;
    chooseChannel: string;
    directMessages: string;
    friendsTab: string;
    profileSettings: string;
    profileTab: string;
    serverName: string;
    textChannels: string;
    voiceChannels: string;
  };
  language: Language;
  selectedChannel?: Channel;
  selectedConversation?: DirectConversation;
  selectedServer?: Server;
  serverDirectoryOpen: boolean;
  status: string;
  textChannelsCount: number;
  toast: string;
  voiceChannelsCount: number;
  workspaceMode: WorkspaceMode;
  onToggleAdminPanel: () => void;
  onToggleChannelPanel: () => void;
  onToggleServerDirectory: () => void;
};

export function WorkspaceTopbar({
  adminPanelOpen,
  channelPanelOpen,
  connectedVoiceSession,
  i18n,
  language,
  selectedChannel,
  selectedConversation,
  selectedServer,
  serverDirectoryOpen,
  status,
  textChannelsCount,
  toast,
  voiceChannelsCount,
  workspaceMode,
  onToggleAdminPanel,
  onToggleChannelPanel,
  onToggleServerDirectory,
}: WorkspaceTopbarProps) {
  const badgeLabel = workspaceMode === 'servers'
    ? selectedServer?.name ?? i18n.serverName
    : workspaceMode === 'friends'
      ? i18n.friendsTab
      : i18n.profileTab;

  const title = workspaceMode === 'servers'
    ? selectedChannel
      ? selectedChannel.name
      : selectedServer?.name ?? i18n.chooseChannel
    : workspaceMode === 'friends'
      ? selectedConversation?.participant?.displayName ?? i18n.directMessages
      : i18n.profileSettings;

  const subtitle = workspaceMode === 'servers' && selectedServer
    ? `${textChannelsCount} ${i18n.textChannels} • ${voiceChannelsCount} ${i18n.voiceChannels}`
    : status;

  return (
    <header className="topbar panel">
      <div className="topbar-main">
        <div className="topbar-context">
          <span className="badge">{badgeLabel}</span>
          {connectedVoiceSession ? (
            <span className="summary-pill">
              {language === 'ru' ? `В голосе: ${connectedVoiceSession.channelName}` : `In voice: ${connectedVoiceSession.channelName}`}
            </span>
          ) : null}
        </div>
        <h1>{title}</h1>
        {toast ? null : <p>{subtitle}</p>}
      </div>

      <div className="meta-grid">
        {workspaceMode === 'servers' ? (
          <>
            <button
              className={serverDirectoryOpen ? 'ghost-button icon-compact topbar-toggle active' : 'ghost-button icon-compact topbar-toggle'}
              type="button"
              onClick={onToggleServerDirectory}
              title={language === 'ru' ? 'Серверы' : 'Servers'}
            >
              <ActionIcon kind="panel" />
            </button>
            <button
              className={channelPanelOpen ? 'ghost-button icon-compact topbar-toggle active' : 'ghost-button icon-compact topbar-toggle'}
              type="button"
              onClick={onToggleChannelPanel}
              title={language === 'ru' ? 'Каналы' : 'Channels'}
            >
              <ActionIcon kind="menu" />
            </button>
            <button
              className={adminPanelOpen ? 'ghost-button icon-compact topbar-toggle active' : 'ghost-button icon-compact topbar-toggle'}
              type="button"
              onClick={onToggleAdminPanel}
              title={language === 'ru' ? 'Управление' : 'Admin'}
            >
              <ActionIcon kind="settings" />
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}
