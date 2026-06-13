import type { AuthUser, Server } from '../types';
import type { Language, VoiceFlags, WorkspaceMode } from '../app/types';

import { ActionIcon, ProfileAvatar } from './app-primitives';

type ServerDirectorySidebarProps = {
  conversationsCount: number;
  i18n: {
    deafen: string;
    friendsTab: string;
    logOut: string;
    members: string;
    messages: string;
    mute: string;
    newServer: string;
    profileTab: string;
    undeafen: string;
    unmute: string;
  };
  language: Language;
  railActiveServerId?: string;
  servers: Server[];
  user: AuthUser;
  voiceFlags: VoiceFlags;
  workspaceMode: WorkspaceMode;
  onLogout: () => void;
  onOpenFriends: () => void;
  onOpenProfile: () => void;
  onOpenServerModal: () => void;
  onSelectServer: (serverId: string) => void;
  onToggleDeafen: () => void;
  onToggleMute: () => void;
};

export function ServerDirectorySidebar({
  conversationsCount,
  i18n,
  language,
  railActiveServerId,
  servers,
  user,
  voiceFlags,
  workspaceMode,
  onLogout,
  onOpenFriends,
  onOpenProfile,
  onOpenServerModal,
  onSelectServer,
  onToggleDeafen,
  onToggleMute,
}: ServerDirectorySidebarProps) {
  return (
    <>
      <div className="server-rail panel">
        <button
          className={workspaceMode === 'friends' ? 'server-rail-button active' : 'server-rail-button'}
          type="button"
          onClick={onOpenFriends}
          title={i18n.friendsTab}
        >
          DM
        </button>
        {servers.map((server) => (
          <button
            key={`rail-${server.id}`}
            className={server.id === railActiveServerId ? 'server-rail-button active' : 'server-rail-button'}
            type="button"
            onClick={() => onSelectServer(server.id)}
            title={server.name}
          >
            {server.name.slice(0, 2).toUpperCase()}
          </button>
        ))}
        <button className="server-rail-button" type="button" onClick={onOpenServerModal} title={i18n.newServer}>
          +
        </button>
        <button
          className={workspaceMode === 'profile' ? 'server-rail-button active' : 'server-rail-button'}
          type="button"
          onClick={onOpenProfile}
          title={i18n.profileTab}
        >
          {user.displayName.slice(0, 1).toUpperCase()}
        </button>
      </div>

      <div className="panel profile-dock">
        <button className="profile-dock-main" type="button" onClick={onOpenProfile}>
          <ProfileAvatar user={user} />
          <div className="profile-dock-meta">
            <strong>{user.displayName}</strong>
            <span>@{user.username}</span>
          </div>
        </button>
        <div className="profile-dock-actions">
          <button
            className={voiceFlags.muted ? 'danger-button icon-compact' : 'ghost-button icon-compact'}
            type="button"
            onClick={onToggleMute}
            title={voiceFlags.muted ? i18n.unmute : i18n.mute}
          >
            <ActionIcon kind="mute" />
          </button>
          <button
            className={voiceFlags.deafened ? 'danger-button icon-compact' : 'ghost-button icon-compact'}
            type="button"
            onClick={onToggleDeafen}
            title={voiceFlags.deafened ? i18n.undeafen : i18n.deafen}
          >
            <ActionIcon kind="ear" />
          </button>
          <button className="ghost-button icon-compact" type="button" onClick={onOpenProfile} title={i18n.profileTab}>
            <ActionIcon kind="settings" />
          </button>
          <button className="ghost-button icon-compact" type="button" onClick={onLogout} title={i18n.logOut}>
            <ActionIcon kind="logout" />
          </button>
        </div>
      </div>

      <button
        className={workspaceMode === 'friends' ? 'list-item nav-list-item active' : 'list-item nav-list-item'}
        type="button"
        onClick={onOpenFriends}
      >
        <strong>{i18n.friendsTab}</strong>
        <span>{conversationsCount} {i18n.messages}</span>
      </button>

      <div className="subsection-heading sidebar-subsection-heading">
        <strong>{language === 'ru' ? 'Серверы' : 'Servers'}</strong>
        <button className="ghost-button icon-compact" type="button" onClick={onOpenServerModal} title={i18n.newServer}>
          <ActionIcon kind="plus" />
        </button>
      </div>

      <div className="list-block server-browser-list">
        {servers.map((server) => (
          <button
            key={server.id}
            className={server.id === railActiveServerId ? 'list-item server-browser-item active' : 'list-item server-browser-item'}
            type="button"
            onClick={() => onSelectServer(server.id)}
          >
            <span className="server-browser-icon">{server.name.slice(0, 2).toUpperCase()}</span>
            <div className="server-browser-meta">
              <strong>{server.name}</strong>
              <span>{server.memberCount} {i18n.members}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
