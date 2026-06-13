import type { Dispatch, FormEvent, SetStateAction } from 'react';

import { api } from '../lib/api';
import { asMessage } from './app-ui';
import type { AuthResponse, AuthUser, Channel, DirectConversation, Friend, FriendRequest, Message, Server, ServerMember } from '../types';

type SetState<T> = Dispatch<SetStateAction<T>>;

type UseWorkspaceDataParams = {
  authForm: { username: string; displayName: string; password: string };
  authMode: 'login' | 'register';
  canCreateChannel: boolean;
  canManageServer: boolean;
  channelAccessForm: { channelId: string; password: string };
  channelSettingsDrafts: Record<string, { name: string; isPrivate: boolean; password: string }>;
  channels: Channel[];
  createChannelForm: { name: string; type: 'text' | 'voice'; isPrivate: boolean; password: string };
  createServerForm: { name: string; description: string };
  i18n: any;
  joinServerForm: { serverId: string };
  language: 'ru' | 'en';
  linkedTextChannel: Channel | null;
  messageDraft: string;
  pushToast: (message: string) => void;
  pushNotification: (title: string, body: string, tone?: 'soft' | 'alert') => void;
  selectedChannel: Channel | null;
  selectedChannelId: string;
  selectedConversationId: string;
  selectedServer: Server | null;
  selectedServerId: string;
  selectedTextChannelId: string;
  serverSettingsForm: { name: string; description: string };
  token: string;
  unlockedChannelIds: string[];
  user: AuthUser | null;
  userSearchQuery: string;
  setChannelAccessForm: SetState<{ channelId: string; password: string }>;
  setChannelSettingsDrafts: SetState<Record<string, { name: string; isPrivate: boolean; password: string }>>;
  setChannels: SetState<Channel[]>;
  setConversations: SetState<DirectConversation[]>;
  setCreateChannelForm: SetState<{ name: string; type: 'text' | 'voice'; isPrivate: boolean; password: string }>;
  setCreateServerForm: SetState<{ name: string; description: string }>;
  setDirectMessages: SetState<any[]>;
  setDirectMessageDraft: SetState<string>;
  setError: SetState<string>;
  setFriendRequests: SetState<FriendRequest[]>;
  setFriends: SetState<Friend[]>;
  setMessages: SetState<Message[]>;
  setMessageDraft: SetState<string>;
  setSelectedChannelId: SetState<string>;
  setSelectedConversationId: SetState<string>;
  setSelectedMemberActionUserId: SetState<string>;
  setSelectedServerId: SetState<string>;
  setSelectedTextChannelId: SetState<string>;
  setServerDirectoryOpen: SetState<boolean>;
  setServerMembers: SetState<ServerMember[]>;
  setServers: SetState<Server[]>;
  setStatus: SetState<string>;
  setToken: SetState<string>;
  setUnlockedChannelIds: SetState<string[]>;
  setRefreshToken: SetState<string>;
  setUser: SetState<AuthUser | null>;
  setUserSearchResults: SetState<AuthUser[]>;
  setWorkspaceMode: SetState<'servers' | 'friends' | 'profile'>;
  setAdminPanelOpen: SetState<boolean>;
  setChannelPanelOpen: SetState<boolean>;
};

export function useWorkspaceData({
  authForm,
  authMode,
  canCreateChannel,
  canManageServer,
  channelAccessForm,
  channelSettingsDrafts,
  channels,
  createChannelForm,
  createServerForm,
  i18n,
  joinServerForm,
  language,
  linkedTextChannel,
  messageDraft,
  pushNotification,
  pushToast,
  selectedChannel,
  selectedChannelId,
  selectedConversationId,
  selectedServer,
  selectedServerId,
  selectedTextChannelId,
  serverSettingsForm,
  token,
  unlockedChannelIds,
  user,
  userSearchQuery,
  setAdminPanelOpen,
  setChannelAccessForm,
  setChannelPanelOpen,
  setChannelSettingsDrafts,
  setChannels,
  setConversations,
  setCreateChannelForm,
  setCreateServerForm,
  setDirectMessages,
  setDirectMessageDraft,
  setError,
  setFriendRequests,
  setFriends,
  setMessages,
  setMessageDraft,
  setRefreshToken,
  setSelectedChannelId,
  setSelectedConversationId,
  setSelectedMemberActionUserId,
  setSelectedServerId,
  setSelectedTextChannelId,
  setServerDirectoryOpen,
  setServerMembers,
  setServers,
  setStatus,
  setToken,
  setUnlockedChannelIds,
  setUser,
  setUserSearchResults,
  setWorkspaceMode,
}: UseWorkspaceDataParams) {
  async function loadServers(currentToken: string) {
    try {
      const list = await api.getServers(currentToken);
      setServers(list);
      if (!selectedServerId && list[0]) {
        setSelectedServerId(list[0].id);
      }
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function loadChannels(currentToken: string, serverId: string) {
    try {
      const list = await api.getChannels(currentToken, serverId);
      setChannels(list);
      const preferredTextChannel =
        list.find((channel) => channel.type === 'text' && !channel.isPrivate) ??
        list.find((channel) => channel.type === 'text');
      if (preferredTextChannel) {
        setSelectedTextChannelId((current) =>
          list.some((channel) => channel.id === current && channel.type === 'text') ? current : preferredTextChannel.id,
        );
      }
      if (!list.find((channel) => channel.id === selectedChannelId)) {
        const preferredChannel =
          list.find((channel) => !channel.isPrivate) ??
          (selectedServer?.currentUserRole === 'owner' ? list[0] : undefined);
        setSelectedChannelId(preferredChannel?.id ?? '');
      }
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function loadServerMembers(currentToken: string, serverId: string) {
    try {
      const list = await api.getServerMembers(currentToken, serverId);
      setServerMembers(list);
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function loadMessages(currentToken: string, serverId: string, channelId: string) {
    try {
      const list = await api.getMessages(currentToken, serverId, channelId);
      setMessages(list);
    } catch (nextError) {
      const message = asMessage(nextError);
      if (message.toLowerCase().includes('channel not found')) {
        setMessages([]);
        return;
      }
      setError(message);
    }
  }

  async function loadFriends(currentToken: string) {
    try {
      setFriends(await api.getFriends(currentToken));
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function loadFriendRequests(currentToken: string) {
    try {
      setFriendRequests(await api.getFriendRequests(currentToken));
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function loadConversations(currentToken: string) {
    try {
      const list = await api.getDirectConversations(currentToken);
      setConversations(list);
      if (!selectedConversationId && list[0]) {
        setSelectedConversationId(list[0].id);
      }
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function loadDirectMessages(currentToken: string, conversationId: string) {
    try {
      setDirectMessages(await api.getDirectMessages(currentToken, conversationId));
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function pollServerChannelNotifications(currentToken: string, serverId: string) {
    const visibleTextChannels = channels.filter(
      (channel) =>
        channel.type === 'text' && (!channel.isPrivate || canCreateChannel || unlockedChannelIds.includes(channel.id)),
    );

    for (const channel of visibleTextChannels) {
      try {
        const list = await api.getMessages(currentToken, serverId, channel.id);
        const lastMessage = list[list.length - 1];
        if (!lastMessage?.id || lastMessage.author?.id === user?.id) {
          continue;
        }

        pushNotification(
          language === 'ru' ? 'Новое сообщение в канале' : 'New channel message',
          `${channel.name}: ${lastMessage.author?.displayName ?? lastMessage.author?.username ?? i18n.unknownUser} - ${lastMessage.content}`,
          channel.id === selectedTextChannelId ? 'soft' : 'alert',
        );
      } catch {
        // ignore per-channel polling failures
      }
    }
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      const response: AuthResponse =
        authMode === 'register'
          ? await api.register(authForm)
          : await api.login({ username: authForm.username, password: authForm.password });
      setToken(response.accessToken);
      setRefreshToken(response.refreshToken);
      setUser(response.user);
      setStatus(`${i18n.authenticatedAs} ${response.user.displayName}`);
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleCreateServer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    try {
      const server = await api.createServer(token, createServerForm);
      setServers((current) => [server, ...current]);
      setSelectedServerId(server.id);
      setSelectedChannelId('');
      setAdminPanelOpen(false);
      setServerDirectoryOpen(false);
      setChannelPanelOpen(true);
      setCreateServerForm({ name: '', description: '' });
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleJoinServer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !joinServerForm.serverId.trim()) return;
    try {
      const server = await api.joinServer(token, joinServerForm.serverId.trim());
      setServers((current) => {
        const next = current.filter((item) => item.id !== server.id);
        return [server, ...next];
      });
      setSelectedServerId(server.id);
      setSelectedChannelId('');
      setAdminPanelOpen(false);
      setServerDirectoryOpen(false);
      setChannelPanelOpen(true);
      setStatus(`${i18n.joinedServer} ${server.name}`);
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleCreateChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedServerId || !canCreateChannel) return;
    try {
      const channel = await api.createChannel(token, selectedServerId, createChannelForm);
      setChannels((current) => [...current, channel]);
      setSelectedChannelId(channel.id);
      setCreateChannelForm({ name: '', type: 'text', isPrivate: false, password: '' });
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleUpdateServer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedServerId || !canManageServer) return;
    try {
      const server = await api.updateServer(token, selectedServerId, serverSettingsForm);
      setServers((current) => current.map((item) => (item.id === server.id ? server : item)));
      setStatus(`${i18n.serverUpdated}: ${server.name}`);
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleRemoveMember(memberUserId: string) {
    if (!token || !selectedServerId || !canManageServer) return;
    try {
      await api.removeServerMember(token, selectedServerId, memberUserId);
      setServerMembers((current) => current.filter((member) => member.userId !== memberUserId));
      setServers((current) =>
        current.map((server) =>
          server.id === selectedServerId ? { ...server, memberCount: Math.max(0, server.memberCount - 1) } : server,
        ),
      );
      setStatus(i18n.serverMemberRemoved);
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleModerateMember(
    memberUserId: string,
    action: 'mute' | 'deafen' | 'block_share' | 'ban' | 'clear_mute' | 'clear_deafen' | 'clear_block_share' | 'clear_ban',
    durationMinutes?: number,
  ) {
    if (!token || !selectedServerId || !canManageServer) return;
    try {
      await api.moderateServerMember(token, selectedServerId, memberUserId, { action, durationMinutes });
      await loadServerMembers(token, selectedServerId);
      setSelectedMemberActionUserId(memberUserId);
      pushToast(language === 'ru' ? (action.startsWith('clear_') ? 'Ограничение снято' : 'Ограничение применено') : (action.startsWith('clear_') ? 'Restriction cleared' : 'Restriction applied'));
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleClearMemberRestrictions(memberUserId: string) {
    if (!token || !selectedServerId || !canManageServer) return;
    try {
      await Promise.all([
        api.moderateServerMember(token, selectedServerId, memberUserId, { action: 'clear_mute' }),
        api.moderateServerMember(token, selectedServerId, memberUserId, { action: 'clear_deafen' }),
        api.moderateServerMember(token, selectedServerId, memberUserId, { action: 'clear_block_share' }),
        api.moderateServerMember(token, selectedServerId, memberUserId, { action: 'clear_ban' }),
      ]);
      await loadServerMembers(token, selectedServerId);
      setSelectedMemberActionUserId(memberUserId);
      pushToast(language === 'ru' ? 'Ограничения сняты' : 'Restrictions cleared');
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleRemoveSpecificChannel(channelId: string) {
    if (!token || !selectedServerId || !canCreateChannel) return;
    try {
      await api.removeChannel(token, selectedServerId, channelId);
      setChannels((current) => current.filter((channel) => channel.id !== channelId));
      setChannelSettingsDrafts((current) => {
        const next = { ...current };
        delete next[channelId];
        return next;
      });
      if (selectedChannelId === channelId) setSelectedChannelId('');
      pushToast(language === 'ru' ? 'Канал удалён' : 'Channel removed');
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleUpdateChannel(channelId: string) {
    if (!token || !selectedServerId || !canManageServer) return;
    const draft = channelSettingsDrafts[channelId];
    if (!draft) return;
    try {
      const updated = await api.updateChannel(token, selectedServerId, channelId, {
        name: draft.name,
        isPrivate: draft.isPrivate,
        password: draft.password || undefined,
      });
      setChannels((current) => current.map((channel) => (channel.id === channelId ? updated : channel)));
      setChannelSettingsDrafts((current) => ({
        ...current,
        [channelId]: { name: updated.name, isPrivate: updated.isPrivate, password: '' },
      }));
      pushToast(language === 'ru' ? 'Канал обновлён' : 'Channel updated');
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleSelectChannel(channel: Channel) {
    if (!token || !selectedServerId) return;
    if (!channel.isPrivate || canCreateChannel || unlockedChannelIds.includes(channel.id)) {
      setError('');
      setSelectedChannelId(channel.id);
      if (channel.type === 'text') setSelectedTextChannelId(channel.id);
      setChannelAccessForm({ channelId: '', password: '' });
      return;
    }
    setChannelAccessForm({ channelId: channel.id, password: '' });
  }

  async function handleUnlockChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedServerId || !channelAccessForm.channelId) return;
    try {
      await api.accessChannel(token, selectedServerId, channelAccessForm.channelId, channelAccessForm.password);
      setUnlockedChannelIds((current) =>
        current.includes(channelAccessForm.channelId) ? current : [...current, channelAccessForm.channelId],
      );
      setSelectedChannelId(channelAccessForm.channelId);
      const unlockedChannel = channels.find((channel) => channel.id === channelAccessForm.channelId);
      if (unlockedChannel?.type === 'text') setSelectedTextChannelId(unlockedChannel.id);
      setChannelAccessForm({ channelId: '', password: '' });
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const targetChannelId = selectedChannel?.type === 'text' ? selectedChannel.id : linkedTextChannel?.id;
    if (!token || !selectedServerId || !targetChannelId || !messageDraft.trim()) return;
    try {
      const message = await api.sendMessage(token, selectedServerId, targetChannelId, messageDraft.trim());
      setMessages((current) => [...current, message]);
      setMessageDraft('');
      await loadMessages(token, selectedServerId, targetChannelId);
      pushToast(language === 'ru' ? 'Сообщение отправлено' : 'Message sent');
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleSearchUsers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !userSearchQuery.trim()) return;
    try {
      setUserSearchResults(await api.searchUsers(token, userSearchQuery.trim()));
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleSendFriendRequest(target: string) {
    if (!token) return;
    try {
      await api.sendFriendRequest(token, target);
      await loadFriendRequests(token);
      pushToast(language === 'ru' ? 'Заявка отправлена' : 'Request sent');
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleAcceptFriendRequest(requestId: string) {
    if (!token) return;
    try {
      await api.acceptFriendRequest(token, requestId);
      await loadFriendRequests(token);
      await loadFriends(token);
      pushToast(language === 'ru' ? 'Друг добавлен' : 'Friend added');
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleRemoveFriend(friendUserId: string) {
    if (!token) return;
    try {
      await api.removeFriend(token, friendUserId);
      await loadFriends(token);
      await loadConversations(token);
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleOpenConversation(otherUserId: string) {
    if (!token) return;
    try {
      const conversation = await api.ensureDirectConversation(token, otherUserId);
      await loadConversations(token);
      setSelectedConversationId(conversation.id);
      setWorkspaceMode('friends');
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleSendDirectMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedConversationId || !directMessageDraft.trim()) return;
    try {
      const message = await api.sendDirectMessage(token, selectedConversationId, directMessageDraft.trim());
      setDirectMessages((current) => [...current, message]);
      setDirectMessageDraft('');
      await loadConversations(token);
      pushToast(language === 'ru' ? 'Личное сообщение отправлено' : 'Direct message sent');
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleCopy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(`${label}: ${i18n.copied}`);
      pushToast(i18n.copied);
    } catch {
      setError(asMessage(new Error('Clipboard is not available')));
    }
  }

  return {
    handleAcceptFriendRequest,
    handleAuthSubmit,
    handleClearMemberRestrictions,
    handleCopy,
    handleCreateChannel,
    handleCreateServer,
    handleJoinServer,
    handleModerateMember,
    handleOpenConversation,
    handleRemoveFriend,
    handleRemoveMember,
    handleRemoveSpecificChannel,
    handleSearchUsers,
    handleSelectChannel,
    handleSendDirectMessage,
    handleSendFriendRequest,
    handleSendMessage,
    handleUnlockChannel,
    handleUpdateChannel,
    handleUpdateServer,
    loadChannels,
    loadConversations,
    loadDirectMessages,
    loadFriendRequests,
    loadFriends,
    loadMessages,
    loadServerMembers,
    loadServers,
    pollServerChannelNotifications,
  };
}
