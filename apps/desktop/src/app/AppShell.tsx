import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { RnnoiseWorkletNode, loadRnnoise } from '@sapphi-red/web-noise-suppressor';
import rnnoiseWorkletPath from '@sapphi-red/web-noise-suppressor/rnnoiseWorklet.js?url';
import rnnoiseWasmPath from '@sapphi-red/web-noise-suppressor/rnnoise.wasm?url';
import rnnoiseSimdWasmPath from '@sapphi-red/web-noise-suppressor/rnnoise_simd.wasm?url';

import { api, configureApiSession } from '../lib/api';
import { createRealtimeSocket } from '../lib/socket';
import { AuthView } from '../screens/AuthView';
import { FriendsView } from '../screens/FriendsView';
import { ProfileView } from '../screens/ProfileView';
import { TextChannelView } from '../screens/TextChannelView';
import type {
  AuthResponse,
  AuthUser,
  Channel,
  ConnectionMetrics,
  DirectConversation,
  DirectMessage,
  Friend,
  FriendRequest,
  Message,
  Server,
  ServerMember,
  VoiceParticipant,
} from '../types';
import type {
  AudioEnhancementMode,
  AuthMode,
  AvatarEditorState,
  ConnectedVoiceSession,
  FriendsPanelTab,
  Language,
  PeerDebugState,
  ProfilePanelTab,
  RemoteMedia,
  ServerPanelTab,
  SignalingDescription,
  SignalingIce,
  VoiceFlags,
  WorkspaceMode,
} from './types';
import { ActionIcon, ChannelGlyph, LogoMark, ProfileAvatar, ToggleRow, ToggleSwitch, UserAvatarPreview, UserIdentity } from '../components/app-primitives';

const TOKEN_KEY = 'diploma_voip_access_token';
const REFRESH_KEY = 'diploma_voip_refresh_token';
const USER_KEY = 'diploma_voip_user';
const LANGUAGE_KEY = 'diploma_voip_language';
const AUDIO_MODE_KEY = 'voistra_audio_enhancement_mode';
type AppNotification = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

const COPY = {
  ru: {
    appReady: 'Voistra готова к работе',
    authHeadline: 'Voistra',
    authBody: 'Быстрый вход в рабочее пространство.',
    login: 'Вход',
    register: 'Регистрация',
    username: 'Логин',
    displayName: 'Отображаемое имя',
    password: 'Пароль',
    createAccount: 'Создать аккаунт',
    signIn: 'Войти',
    logOut: 'Выйти',
    newServer: 'Новый сервер',
    ownerSpace: 'Пространство владельца',
    serverName: 'Название сервера',
    description: 'Описание',
    createServer: 'Создать сервер',
    joinServer: 'Войти на сервер',
    byId: 'По ID',
    joinByServerId: 'Подключиться по ID сервера',
    pasteServerId: 'Вставь ID сервера',
    noDescription: 'Без описания',
    members: 'участников',
    channels: 'каналов',
    manageAccess: 'Управление',
    memberAccess: 'Доступ участника',
    text: 'Текст',
    voice: 'Голос',
    privateChannel: 'Приватный канал',
    createChannel: 'Создать канал',
    ownerOnlyChannels: 'Создавать и удалять каналы может только владелец сервера.',
    privateState: 'Приватный',
    openState: 'Открыт',
    status: 'Статус',
    chooseChannel: 'Выбери канал',
    metricTicks: 'циклов метрик',
    textChat: 'Текстовый чат',
    messages: 'сообщений',
    typeMessage: 'Напиши сообщение',
    send: 'Отправить',
    serverOverview: 'Обзор сервера',
    owner: 'Владелец',
    yourRole: 'Твоя роль',
    ownerConsole: 'Консоль владельца',
    serverSettings: 'Настройки сервера',
    saveServer: 'Сохранить сервер',
    memberDirectory: 'Участники',
    people: 'чел.',
    remove: 'Удалить',
    voiceControl: 'Голос',
    voiceRoomLimit: 'До 10 участников',
    joinVoice: 'Войти в голос',
    leaveVoice: 'Выйти из голоса',
    mute: 'Микрофон',
    unmute: 'Включить микрофон',
    deafen: 'Звук',
    undeafen: 'Включить звук',
    speakingState: 'Говорю',
    pushToTalk: 'Push-to-talk',
    voiceActivation: 'Активация голосом',
    voiceSettings: 'Настройки голоса',
    captureSettings: 'Захват и звук',
    noiseSuppression: 'Шумоподавление',
    echoCancellation: 'Эхо-подавление',
    autoGainControl: 'Автоусиление',
    allowStreamAudio: 'Передавать системный звук',
    deleteChannel: 'Удалить канал',
    screenShare: 'Демонстрация экрана',
    inactive: 'Не активна',
    startShare: 'Начать',
    stopShare: 'Остановить',
    shareHint:
      'Каждый участник может публиковать один экран. В комнате на троих двое могут смотреть одного, либо все трое могут показывать экран одновременно.',
    liveShares: 'Активные трансляции',
    noShares: 'Пока никто не делится экраном. Запусти демонстрацию, чтобы опубликовать превью для всех в голосовой комнате.',
    connectionMetrics: 'Метрики соединения',
    realtimeUpdates: 'Обновления в реальном времени',
    webrtcDebug: 'Отладка WebRTC',
    noPeerDiagnostics: 'Пока нет данных о peer-соединениях',
    joinVoiceForDebug: 'Зайди в голосовой канал с другим клиентом, чтобы увидеть состояние signaling и ICE.',
    selectChannelBegin: 'Выбери канал',
    selectChannelHelp: 'Создай сервер или войди на существующий, затем открой текстовый или голосовой раздел внутри Voistra.',
    appLanguage: 'Язык',
    russian: 'Русский',
    english: 'English',
    lockedChannel: 'Этот канал защищён паролем',
    unlockChannel: 'Открыть канал',
    channelPassword: 'Пароль канала',
    cancel: 'Отмена',
    connect: 'Подключить',
    participantVolume: 'Громкость участника',
    shareVolume: 'Громкость трансляции',
    fullscreen: 'Во весь экран',
    speaking: 'Говорит',
    idle: 'Не говорит',
    micOpen: 'Микрофон открыт',
    mutedState: 'Микрофон выключен',
    listening: 'Слышит',
    deafenedState: 'Звук выключен',
    sharing: 'Трансляция',
    live: 'В эфире',
    you: 'Ты',
    remoteScreen: 'экран',
    yourSharePublished: 'Твоя трансляция отправляется всем peer-подключениям.',
    remoteSharePending: 'Удалённая трансляция появится ниже, как только видеотрек будет прикреплён.',
    channelPeers: 'Получателей в канале',
    browser: 'браузер',
    updateServerName: 'Обновить название сервера',
    updateDescription: 'Обновить описание',
    general: 'основной',
    unknownUser: 'Неизвестный пользователь',
    turnReady: 'TURN готов',
    realtimeConnected: 'Realtime подключён',
    realtimeDisconnected: 'Realtime отключён',
    connectedToVoice: 'Подключён к голосовому каналу',
    disconnectedFrom: 'Отключён от',
    joinedServer: 'Подключился к серверу',
    authenticatedAs: 'Выполнен вход как',
    serverUpdated: 'Сервер обновлён',
    serverMemberRemoved: 'Участник удалён',
    channelRemoved: 'Канал удалён',
    ownerRole: 'Владелец',
    adminRole: 'Администратор',
    memberRole: 'Участник',
    unknownOwner: 'Неизвестный владелец',
    serverId: 'Server ID',
    activeNow: 'активно',
    desktop: 'desktop',
    unknown: 'неизвестно',
    appVersion: 'Версия',
    serverDraftName: 'Команда Voistra',
    serverDraftDescription: 'Спокойное голосовое пространство для команды',
    textChannels: 'Текстовые каналы',
    voiceChannels: 'Голосовые каналы',
    voiceMembers: 'Участники голоса',
    peers: 'peers',
    rtt: 'RTT',
    jitter: 'Jitter',
    packetLoss: 'Потери',
    bitrate: 'Битрейт',
    lastEvent: 'Последнее событие',
    signaling: 'Сигналинг',
    ice: 'ICE',
    peer: 'Peer',
    localDescription: 'Локальное описание',
    remoteDescription: 'Удалённое описание',
    localTracks: 'Локальные треки',
    remoteTracks: 'Удалённые треки',
    offersAnswers: 'Offer/answer',
    iceSentReceived: 'ICE отправлено/получено',
    pendingIce: 'ICE в очереди',
    updated: 'Обновлено',
    audioTrack: 'аудио',
    videoTrack: 'видео',
    yes: 'да',
    no: 'нет',
    unexpectedError: 'Непредвиденная ошибка',
    serversTab: 'Серверы',
    friendsTab: 'Друзья',
    profileTab: 'Профиль',
    profileSettings: 'Профиль и настройки',
    profileSubtitle: 'Аватар, имя, пароль и голосовые параметры в одном месте.',
    avatarUrl: 'Ссылка на аватар',
    bio: 'О себе',
    saveProfile: 'Сохранить профиль',
    currentPassword: 'Текущий пароль',
    newPassword: 'Новый пароль',
    audioDefaults: 'Параметры аудио по умолчанию',
    audioMode: 'Режим обработки',
    voiceFocusMode: 'Voice Focus',
    balancedMode: 'Balanced',
    studioMode: 'Studio',
    voiceFocusHint: 'Максимально очищает голос для созвонов и шумных комнат.',
    balancedHint: 'Сохраняет баланс между чистотой речи и естественностью.',
    studioHint: 'Минимум обработки для хорошего микрофона и тихой комнаты.',
    findPeople: 'Найти пользователей',
    searchUsers: 'Поиск по имени или ID',
    addFriend: 'Добавить в друзья',
    friendRequests: 'Заявки',
    incoming: 'Входящие',
    outgoing: 'Исходящие',
    accept: 'Принять',
    removeFriend: 'Удалить из друзей',
    directMessages: 'Личные сообщения',
    openDialog: 'Открыть диалог',
    startDialog: 'Начать диалог',
    noFriends: 'Пока нет друзей. Найди пользователя и отправь заявку.',
    noConversations: 'Пока нет личных сообщений.',
    dmPlaceholder: 'Напиши личное сообщение',
    copyId: 'Скопировать ID',
    copyServer: 'Поделиться сервером',
    copied: 'Скопировано',
    testVoice: 'Проверка голоса',
    voiceTestHint: 'Скажи что-нибудь, чтобы увидеть, что микрофон активен.',
    micLevel: 'Уровень микрофона',
    outputDevice: 'Вывод звука',
    defaultOutput: 'Системный вывод',
    hubSubtitle: 'Серверы, лички, друзья и голосовые настройки в одном desktop-клиенте.',
    linkedTextRoom: 'Связанный текстовый чат',
    overviewTab: 'Обзор',
    membersTab: 'Участники',
    settingsTab: 'Настройки',
    requestsTab: 'Заявки',
    dialogsTab: 'Диалоги',
    profileIdentity: 'Твоя учётная запись',
    ownerQuickActions: 'Быстрые действия владельца',
    socialSearchResults: 'Результаты поиска',
    friendSince: 'В друзьях с',
    accountTab: 'Аккаунт',
    securityTab: 'Безопасность',
    audioTab: 'Аудио',
    chooseImage: 'Выбрать фото',
    removeImage: 'Убрать фото',
    online: 'В сети',
    offline: 'Не в сети',
    inputLevel: 'Чувствительность микрофона',
    outputLevel: 'Громкость вывода',
    reconnectLabel: 'Автоподключение',
  },
  en: {
    appReady: 'Voistra workspace ready',
    authHeadline: 'Voistra',
    authBody: 'A focused desktop voice workspace.',
    login: 'Login',
    register: 'Register',
    username: 'Username',
    displayName: 'Display name',
    password: 'Password',
    createAccount: 'Create account',
    signIn: 'Sign in',
    logOut: 'Log out',
    newServer: 'New server',
    ownerSpace: 'Owner space',
    serverName: 'Server name',
    description: 'Description',
    createServer: 'Create server',
    joinServer: 'Join server',
    byId: 'By ID',
    joinByServerId: 'Join by server ID',
    pasteServerId: 'Paste server ID',
    noDescription: 'No description',
    members: 'members',
    channels: 'channels',
    manageAccess: 'Manage access',
    memberAccess: 'Member access',
    text: 'Text',
    voice: 'Voice',
    privateChannel: 'Private channel',
    createChannel: 'Create channel',
    ownerOnlyChannels: 'Only the server owner can create or remove channels.',
    privateState: 'Private',
    openState: 'Open',
    status: 'Status',
    chooseChannel: 'Choose channel',
    metricTicks: 'metric ticks',
    textChat: 'Text chat',
    messages: 'messages',
    typeMessage: 'Type a message',
    send: 'Send',
    serverOverview: 'Server overview',
    owner: 'Owner',
    yourRole: 'Your role',
    ownerConsole: 'Owner console',
    serverSettings: 'Server settings',
    saveServer: 'Save server',
    memberDirectory: 'Member directory',
    people: 'people',
    remove: 'Remove',
    voiceControl: 'Voice',
    voiceRoomLimit: 'Up to 10 participants',
    joinVoice: 'Join voice',
    leaveVoice: 'Leave voice',
    mute: 'Mute mic',
    unmute: 'Unmute mic',
    deafen: 'Mute output',
    undeafen: 'Unmute output',
    speakingState: 'Speaking',
    pushToTalk: 'Push-to-talk',
    voiceActivation: 'Voice activation',
    voiceSettings: 'Voice settings',
    captureSettings: 'Capture and audio',
    noiseSuppression: 'Noise suppression',
    echoCancellation: 'Echo cancellation',
    autoGainControl: 'Auto gain',
    allowStreamAudio: 'Share system audio',
    deleteChannel: 'Delete channel',
    screenShare: 'Screen share',
    inactive: 'Inactive',
    startShare: 'Start',
    stopShare: 'Stop',
    shareHint:
      'Every participant can publish one live screen. In a three-person room, two people can watch one sharer, or all three can share at the same time.',
    liveShares: 'Live shares',
    noShares: 'No one is sharing yet. Start a share to publish a preview to everyone in this voice room.',
    connectionMetrics: 'Connection metrics',
    realtimeUpdates: 'Realtime updates',
    webrtcDebug: 'WebRTC debug',
    noPeerDiagnostics: 'No peer diagnostics yet',
    joinVoiceForDebug: 'Join a voice channel with another client to populate signaling and ICE state.',
    selectChannelBegin: 'Select a channel',
    selectChannelHelp: 'Create or join a server, then open a text or voice space inside Voistra.',
    appLanguage: 'Language',
    russian: 'Russian',
    english: 'English',
    lockedChannel: 'This channel is password protected',
    unlockChannel: 'Unlock channel',
    channelPassword: 'Channel password',
    cancel: 'Cancel',
    connect: 'Connect',
    participantVolume: 'Participant volume',
    shareVolume: 'Share volume',
    fullscreen: 'Fullscreen',
    speaking: 'Speaking',
    idle: 'Idle',
    micOpen: 'Mic open',
    mutedState: 'Muted',
    listening: 'Listening',
    deafenedState: 'Deafened',
    sharing: 'Sharing',
    live: 'Live',
    you: 'You',
    remoteScreen: 'screen',
    yourSharePublished: 'Your share is being published to every peer connection.',
    remoteSharePending: 'Remote share will appear below as soon as the video track is attached.',
    channelPeers: 'Channel peers',
    browser: 'browser',
    updateServerName: 'Update server name',
    updateDescription: 'Update description',
    general: 'general',
    unknownUser: 'Unknown user',
    turnReady: 'TURN ready',
    realtimeConnected: 'Realtime connected',
    realtimeDisconnected: 'Realtime disconnected',
    connectedToVoice: 'Connected to voice channel',
    disconnectedFrom: 'Disconnected from',
    joinedServer: 'Joined server',
    authenticatedAs: 'Authenticated as',
    serverUpdated: 'Server updated',
    serverMemberRemoved: 'Server member removed',
    channelRemoved: 'Channel removed',
    ownerRole: 'Owner',
    adminRole: 'Admin',
    memberRole: 'Member',
    unknownOwner: 'Unknown owner',
    serverId: 'Server ID',
    activeNow: 'active',
    desktop: 'desktop',
    unknown: 'unknown',
    appVersion: 'App',
    serverDraftName: 'Voistra Team',
    serverDraftDescription: 'Calm voice workspace',
    textChannels: 'Text channels',
    voiceChannels: 'Voice channels',
    voiceMembers: 'Voice members',
    peers: 'peers',
    rtt: 'RTT',
    jitter: 'Jitter',
    packetLoss: 'Packet loss',
    bitrate: 'Bitrate',
    lastEvent: 'Last event',
    signaling: 'Signaling',
    ice: 'ICE',
    peer: 'Peer',
    localDescription: 'Local description',
    remoteDescription: 'Remote description',
    localTracks: 'Local tracks',
    remoteTracks: 'Remote tracks',
    offersAnswers: 'Offers/answers',
    iceSentReceived: 'ICE sent/received',
    pendingIce: 'Pending ICE',
    updated: 'Updated',
    audioTrack: 'audio',
    videoTrack: 'video',
    yes: 'yes',
    no: 'no',
    unexpectedError: 'Unexpected error',
    serversTab: 'Servers',
    friendsTab: 'Friends',
    profileTab: 'Profile',
    profileSettings: 'Profile and settings',
    profileSubtitle: 'Avatar, identity, password and voice defaults in one place.',
    avatarUrl: 'Avatar URL',
    bio: 'Bio',
    saveProfile: 'Save profile',
    currentPassword: 'Current password',
    newPassword: 'New password',
    audioDefaults: 'Default audio settings',
    audioMode: 'Processing mode',
    voiceFocusMode: 'Voice Focus',
    balancedMode: 'Balanced',
    studioMode: 'Studio',
    voiceFocusHint: 'Stronger cleanup for calls and noisy rooms.',
    balancedHint: 'A balanced voice chain for everyday conversations.',
    studioHint: 'Minimal processing for a good microphone in a quiet room.',
    findPeople: 'Find people',
    searchUsers: 'Search by name or ID',
    addFriend: 'Add friend',
    friendRequests: 'Requests',
    incoming: 'Incoming',
    outgoing: 'Outgoing',
    accept: 'Accept',
    removeFriend: 'Remove friend',
    directMessages: 'Direct messages',
    openDialog: 'Open dialog',
    startDialog: 'Start dialog',
    noFriends: 'No friends yet. Search for a user and send a request.',
    noConversations: 'No direct messages yet.',
    dmPlaceholder: 'Write a direct message',
    copyId: 'Copy ID',
    copyServer: 'Share server',
    copied: 'Copied',
    testVoice: 'Voice check',
    voiceTestHint: 'Say something to confirm your microphone is active.',
    micLevel: 'Microphone level',
    outputDevice: 'Audio output',
    defaultOutput: 'System output',
    hubSubtitle: 'Servers, DMs, friends and voice controls in one desktop client.',
    linkedTextRoom: 'Linked text chat',
    overviewTab: 'Overview',
    membersTab: 'Members',
    settingsTab: 'Settings',
    requestsTab: 'Requests',
    dialogsTab: 'Dialogs',
    profileIdentity: 'Your account',
    ownerQuickActions: 'Owner quick actions',
    socialSearchResults: 'Search results',
    friendSince: 'Friends since',
    accountTab: 'Account',
    securityTab: 'Security',
    audioTab: 'Audio',
    chooseImage: 'Choose image',
    removeImage: 'Remove image',
    online: 'Online',
    offline: 'Offline',
    inputLevel: 'Mic sensitivity',
    outputLevel: 'Output volume',
    reconnectLabel: 'Reconnect',
  },
} as const;

export function AppShell() {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem(LANGUAGE_KEY) as Language) || 'ru');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [token, setToken] = useState<string>(() => localStorage.getItem(TOKEN_KEY) ?? '');
  const [refreshToken, setRefreshToken] = useState<string>(() => localStorage.getItem(REFRESH_KEY) ?? '');
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('servers');
  const [serverPanelTab, setServerPanelTab] = useState<ServerPanelTab>('overview');
  const [friendsPanelTab, setFriendsPanelTab] = useState<FriendsPanelTab>('requests');
  const [profilePanelTab, setProfilePanelTab] = useState<ProfilePanelTab>('account');
  const [selectedMemberActionUserId, setSelectedMemberActionUserId] = useState<string>('');
  const [avatarEditor, setAvatarEditor] = useState<AvatarEditorState>(null);
  const [serverDirectoryOpen, setServerDirectoryOpen] = useState<boolean>(false);
  const [channelPanelOpen, setChannelPanelOpen] = useState<boolean>(true);
  const [adminPanelOpen, setAdminPanelOpen] = useState<boolean>(false);
  const [serverModalOpen, setServerModalOpen] = useState<boolean>(false);
  const [servers, setServers] = useState<Server[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [userSearchResults, setUserSearchResults] = useState<AuthUser[]>([]);
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [directMessageDraft, setDirectMessageDraft] = useState<string>('');
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [connectedVoiceSession, setConnectedVoiceSession] = useState<ConnectedVoiceSession | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [selectedTextChannelId, setSelectedTextChannelId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [serverMembers, setServerMembers] = useState<ServerMember[]>([]);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [metrics, setMetrics] = useState<Record<string, ConnectionMetrics>>({});
  const [status, setStatus] = useState<string>(
    () => COPY[((localStorage.getItem(LANGUAGE_KEY) as Language) || 'ru')].appReady,
  );
  const [toast, setToast] = useState<string>('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [version, setVersion] = useState<string>('');
  const [platform, setPlatform] = useState<string>('');
  const [voiceFlags, setVoiceFlags] = useState<VoiceFlags>({
    muted: false,
    deafened: false,
    pushToTalkActive: false,
    voiceActivationActive: true,
    speaking: false,
  });
  const [messageDraft, setMessageDraft] = useState<string>('');
  const [authForm, setAuthForm] = useState({
    username: '',
    displayName: '',
    password: '',
  });
  const [createServerForm, setCreateServerForm] = useState({ name: '', description: '' });
  const [serverSettingsForm, setServerSettingsForm] = useState({ name: '', description: '' });
  const [profileForm, setProfileForm] = useState({
    displayName: user?.displayName ?? '',
    avatarUrl: user?.avatarUrl ?? '',
    bio: user?.bio ?? '',
    currentPassword: '',
    newPassword: '',
    reconnectEnabled: user?.reconnectEnabled ?? true,
    pushToTalkEnabled: user?.pushToTalkEnabled ?? false,
    voiceActivationEnabled: user?.voiceActivationEnabled ?? true,
    noiseSuppressionEnabled: user?.noiseSuppressionEnabled ?? true,
    echoCancellationEnabled: user?.echoCancellationEnabled ?? true,
    autoGainControlEnabled: user?.autoGainControlEnabled ?? true,
  });
  const [joinServerForm, setJoinServerForm] = useState({ serverId: '' });
  const [createChannelForm, setCreateChannelForm] = useState({
    name: '',
    type: 'text' as 'text' | 'voice',
    isPrivate: false,
    password: '',
  });
  const [channelSettingsDrafts, setChannelSettingsDrafts] = useState<Record<string, { name: string; isPrivate: boolean; password: string }>>({});
  const [channelAccessForm, setChannelAccessForm] = useState({
    channelId: '',
    password: '',
  });
  const [unlockedChannelIds, setUnlockedChannelIds] = useState<string[]>([]);
  const [screenShareLabel, setScreenShareLabel] = useState<string>('');
  const [screenShareEnabled, setScreenShareEnabled] = useState<boolean>(false);
  const [shareSystemAudioEnabled, setShareSystemAudioEnabled] = useState<boolean>(false);
  const [activeScreenShares, setActiveScreenShares] = useState<Record<string, string>>({});
  const [remoteMedia, setRemoteMedia] = useState<Record<string, RemoteMedia>>({});
  const [remoteParticipantVolumes, setRemoteParticipantVolumes] = useState<Record<string, number>>({});
  const [remoteShareVolumes, setRemoteShareVolumes] = useState<Record<string, number>>({});
  const [audioPreferences, setAudioPreferences] = useState({
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    pushToTalkEnabled: false,
    voiceActivationEnabled: true,
  });
  const [audioControlForm, setAudioControlForm] = useState({
    inputLevel: 100,
    outputLevel: 100,
  });
  const [audioEnhancementMode, setAudioEnhancementMode] = useState<AudioEnhancementMode>(() => {
    if (typeof window === 'undefined') {
      return 'voice_focus';
    }
    const saved = window.localStorage.getItem(AUDIO_MODE_KEY);
    if (saved === 'voice_focus' || saved === 'balanced' || saved === 'studio') {
      return saved;
    }
    return 'voice_focus';
  });
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputDeviceId, setSelectedInputDeviceId] = useState<string>('default');
  const [selectedOutputDeviceId, setSelectedOutputDeviceId] = useState<string>('default');
  const [micTestLevel, setMicTestLevel] = useState<number>(0);
  const [micTestRunning, setMicTestRunning] = useState<boolean>(false);
  const [rtcConfig, setRtcConfig] = useState<RTCConfiguration>({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });
  const [networkTicker, setNetworkTicker] = useState<number>(0);
  const [peerDebug, setPeerDebug] = useState<Record<string, PeerDebugState>>({});

  const socketRef = useRef<Socket | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const mixedAudioContextRef = useRef<AudioContext | null>(null);
  const mixedAudioStreamRef = useRef<MediaStream | null>(null);
  const microphoneGainNodeRef = useRef<GainNode | null>(null);
  const rnnoiseBinaryRef = useRef<ArrayBuffer | null>(null);
  const rnnoiseBinaryPromiseRef = useRef<Promise<ArrayBuffer> | null>(null);
  const screenShareStoppingRef = useRef(false);
  const micTestStreamRef = useRef<MediaStream | null>(null);
  const micTestAudioContextRef = useRef<AudioContext | null>(null);
  const micTestAnalyserRef = useRef<AnalyserNode | null>(null);
  const micTestAnimationFrameRef = useRef<number | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const makingOfferRef = useRef<Set<string>>(new Set());
  const ignoredOfferRef = useRef<Set<string>>(new Set());
  const activeVoiceChannelIdRef = useRef<string>('');
  const statsBytesRef = useRef<Map<string, { bytes: number; timestamp: number }>>(new Map());
  const participantSocketsRef = useRef<Map<string, string>>(new Map());

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
  const i18n = COPY[language];
  const showChannelSidebar = workspaceMode === 'servers' && channelPanelOpen;
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
  const avatarPreview = profileForm.avatarUrl || user?.avatarUrl || '';
  const shellUser = user ? { ...user, avatarUrl: avatarPreview || user.avatarUrl } : null;
  const currentInputDeviceLabel =
    inputDevices.find((device) => device.deviceId === selectedInputDeviceId)?.label ||
    (language === 'ru' ? 'Системный микрофон' : 'System microphone');
  const currentOutputDeviceLabel =
    outputDevices.find((device) => device.deviceId === selectedOutputDeviceId)?.label || i18n.defaultOutput;

  useEffect(() => {
    if (workspaceMode !== 'servers' && error) {
      setError('');
    }
  }, [error, workspaceMode]);

  const clampMediaVolume = (value: number) => Math.max(0, Math.min(1, value));
  const toastTimeoutRef = useRef<number | null>(null);
  const previousIncomingRequestCountRef = useRef<number>(0);
  const previousConversationSnapshotRef = useRef<Record<string, string>>({});
  const previousFriendIdsRef = useRef<string[]>([]);
  const previousVoiceParticipantIdsRef = useRef<string[]>([]);
  const previousModerationSnapshotRef = useRef<string>('');
  const previousServerMessageSnapshotRef = useRef<Record<string, string>>({});

  function playNotificationSound(kind: 'soft' | 'alert' = 'soft') {
    try {
      const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) {
        return;
      }
      const context = new AudioContextCtor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = kind === 'alert' ? 'triangle' : 'sine';
      oscillator.frequency.value = kind === 'alert' ? 720 : 540;
      gain.gain.value = 0.0001;
      oscillator.connect(gain);
      gain.connect(context.destination);
      const now = context.currentTime;
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === 'alert' ? 0.32 : 0.22));
      oscillator.start(now);
      oscillator.stop(now + (kind === 'alert' ? 0.35 : 0.25));
      window.setTimeout(() => {
        void context.close().catch(() => undefined);
      }, 500);
    } catch {
      // ignore sound errors
    }
  }

  function pushNotification(title: string, body: string, sound: 'soft' | 'alert' = 'soft') {
    setNotifications((current) => [
      {
        id: crypto.randomUUID(),
        title,
        body,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 20));
    playNotificationSound(sound);
  }

  function pushToast(message: string) {
    setToast(message);
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast('');
      toastTimeoutRef.current = null;
    }, 2400);
  }

  function stopMicTest() {
    if (micTestAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(micTestAnimationFrameRef.current);
      micTestAnimationFrameRef.current = null;
    }
    micTestStreamRef.current?.getTracks().forEach((track) => track.stop());
    micTestStreamRef.current = null;
    micTestAudioContextRef.current?.close().catch(() => undefined);
    micTestAudioContextRef.current = null;
    micTestAnalyserRef.current = null;
    setMicTestRunning(false);
    setMicTestLevel(0);
  }

  function getMediaConstraintFlags(mode: AudioEnhancementMode) {
    if (mode === 'studio') {
      return {
        noiseSuppression: false,
        echoCancellation: false,
        autoGainControl: false,
      };
    }

    if (mode === 'balanced') {
      return {
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true,
      };
    }

    return {
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true,
    };
  }

  function applyLocalAudioTrackState(nextFlags: VoiceFlags) {
    const enabled =
      !nextFlags.muted &&
      !nextFlags.deafened &&
      (nextFlags.voiceActivationActive || nextFlags.pushToTalkActive || nextFlags.speaking);
    audioStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  function applyAudioEnhancementMode(mode: AudioEnhancementMode) {
    setAudioEnhancementMode(mode);

    if (mode === 'voice_focus') {
      setProfileForm((current) => ({
        ...current,
        pushToTalkEnabled: false,
        voiceActivationEnabled: true,
        noiseSuppressionEnabled: true,
        echoCancellationEnabled: true,
        autoGainControlEnabled: true,
      }));
      return;
    }

    if (mode === 'balanced') {
      setProfileForm((current) => ({
        ...current,
        pushToTalkEnabled: false,
        voiceActivationEnabled: true,
        noiseSuppressionEnabled: true,
        echoCancellationEnabled: true,
        autoGainControlEnabled: true,
      }));
      return;
    }

    setProfileForm((current) => ({
      ...current,
      noiseSuppressionEnabled: false,
      echoCancellationEnabled: false,
      autoGainControlEnabled: false,
    }));
  }

  async function loadRnnoiseBinaryOnce() {
    if (rnnoiseBinaryRef.current) {
      return rnnoiseBinaryRef.current;
    }

    if (!rnnoiseBinaryPromiseRef.current) {
      rnnoiseBinaryPromiseRef.current = loadRnnoise({
        url: rnnoiseWasmPath,
        simdUrl: rnnoiseSimdWasmPath,
      }).then((binary) => {
        rnnoiseBinaryRef.current = binary;
        return binary;
      });
    }

    return rnnoiseBinaryPromiseRef.current;
  }

  async function buildProcessedMicrophoneGraph(
    context: AudioContext,
    stream: MediaStream,
    options: {
      inputLevel: number;
      mode: AudioEnhancementMode;
    },
  ) {
    const source = context.createMediaStreamSource(stream);
    const inputGain = context.createGain();
    inputGain.gain.value = Math.max(0, Math.min(2, options.inputLevel / 100));
    source.connect(inputGain);

    let tail: AudioNode = inputGain;

    const highpass = context.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = options.mode === 'studio' ? 70 : options.mode === 'balanced' ? 95 : 120;
    highpass.Q.value = 0.7;
    tail.connect(highpass);
    tail = highpass;

    if (options.mode !== 'studio' && typeof context.audioWorklet !== 'undefined') {
      try {
        await context.audioWorklet.addModule(rnnoiseWorkletPath);
        const wasmBinary = await loadRnnoiseBinaryOnce();
        const rnnoise = new RnnoiseWorkletNode(context, {
          wasmBinary,
          maxChannels: 1,
        });
        tail.connect(rnnoise);
        tail = rnnoise;
      } catch {
        // Fall back to the native Web Audio chain if RNNoise is unavailable.
      }
    }

    if (options.mode !== 'studio') {
      const humCut = context.createBiquadFilter();
      humCut.type = 'notch';
      humCut.frequency.value = 50;
      humCut.Q.value = 3.5;
      tail.connect(humCut);
      tail = humCut;

      const presence = context.createBiquadFilter();
      presence.type = 'peaking';
      presence.frequency.value = 2500;
      presence.Q.value = 1.1;
      presence.gain.value = options.mode === 'voice_focus' ? 2.4 : 1.3;
      tail.connect(presence);
      tail = presence;
    }

    const lowpass = context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = options.mode === 'studio' ? 12000 : options.mode === 'balanced' ? 9000 : 7600;
    lowpass.Q.value = 0.7;
    tail.connect(lowpass);
    tail = lowpass;

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = options.mode === 'voice_focus' ? -30 : options.mode === 'balanced' ? -24 : -18;
    compressor.knee.value = options.mode === 'voice_focus' ? 24 : 18;
    compressor.ratio.value = options.mode === 'voice_focus' ? 12 : options.mode === 'balanced' ? 8 : 3;
    compressor.attack.value = options.mode === 'studio' ? 0.01 : 0.003;
    compressor.release.value = options.mode === 'voice_focus' ? 0.16 : 0.22;
    tail.connect(compressor);
    tail = compressor;

    const outputTrim = context.createGain();
    outputTrim.gain.value = options.mode === 'voice_focus' ? 1.05 : 1;
    tail.connect(outputTrim);
    tail = outputTrim;

    return { source, inputGain, output: tail };
  }

  async function refreshMediaDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setInputDevices(devices.filter((device) => device.kind === 'audioinput'));
      setOutputDevices(devices.filter((device) => device.kind === 'audiooutput'));
    } catch {
      // Best effort device listing.
    }
  }

  async function toggleMicrophoneTest() {
    if (micTestRunning) {
      stopMicTest();
      return;
    }

    try {
      const mediaFlags = getMediaConstraintFlags(audioEnhancementMode);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedInputDeviceId !== 'default' ? { exact: selectedInputDeviceId } : undefined,
          echoCancellation: mediaFlags.echoCancellation,
          noiseSuppression: mediaFlags.noiseSuppression,
          autoGainControl: mediaFlags.autoGainControl,
          channelCount: 1,
        },
      });

      const context = new AudioContext();
      await context.resume().catch(() => undefined);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      const processed = await buildProcessedMicrophoneGraph(context, stream, {
        inputLevel: audioControlForm.inputLevel,
        mode: audioEnhancementMode,
      });
      processed.output.connect(analyser);

      micTestStreamRef.current = stream;
      micTestAudioContextRef.current = context;
      micTestAnalyserRef.current = analyser;
      setMicTestRunning(true);

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sumSquares = 0;
        for (const value of data) {
          const normalized = (value - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / data.length);
        const scaled = audioEnhancementMode === 'voice_focus' ? 260 : audioEnhancementMode === 'balanced' ? 240 : 220;
        setMicTestLevel(Math.max(0, Math.min(100, Math.round(rms * scaled))));
        micTestAnimationFrameRef.current = window.requestAnimationFrame(tick);
      };

      tick();
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(AUDIO_MODE_KEY, audioEnhancementMode);
  }, [audioEnhancementMode]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!window.desktopApi) {
      setVersion('dev');
      setPlatform(i18n.browser);
      return;
    }

    void window.desktopApi.getVersion().then(setVersion).catch(() => setVersion('dev'));
    void window.desktopApi.getPlatform().then(setPlatform).catch(() => setPlatform(i18n.unknown));
  }, [i18n.browser, i18n.unknown]);

  useEffect(() => {
    void refreshMediaDevices();

    const handleDeviceChange = () => {
      void refreshMediaDevices();
    };

    navigator.mediaDevices?.addEventListener?.('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices?.removeEventListener?.('devicechange', handleDeviceChange);
      stopMicTest();
    };
  }, []);

  useEffect(() => {
    document.title = selectedServer ? `Voistra - ${selectedServer.name}` : 'Voistra';
  }, [selectedServer]);

  useEffect(() => {
    if (!token) {
      return;
    }

    localStorage.setItem(TOKEN_KEY, token);
  }, [token]);

  useEffect(() => {
    if (!refreshToken) {
      return;
    }

    localStorage.setItem(REFRESH_KEY, refreshToken);
  }, [refreshToken]);

  useEffect(() => {
    configureApiSession({
      accessToken: token,
      refreshToken,
      onTokens: (nextAccessToken, nextRefreshToken) => {
        setToken(nextAccessToken);
        setRefreshToken(nextRefreshToken);
      },
      onUnauthorized: () => {
        setToken('');
        setRefreshToken('');
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(USER_KEY);
      },
    });
  }, [token, refreshToken]);

  useEffect(() => {
    if (!user) {
      localStorage.removeItem(USER_KEY);
      return;
    }

    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    setProfileForm({
      displayName: user?.displayName ?? '',
      avatarUrl: user?.avatarUrl ?? '',
      bio: user?.bio ?? '',
      currentPassword: '',
      newPassword: '',
      reconnectEnabled: user?.reconnectEnabled ?? true,
      pushToTalkEnabled: user?.pushToTalkEnabled ?? false,
      voiceActivationEnabled: user?.voiceActivationEnabled ?? true,
      noiseSuppressionEnabled: user?.noiseSuppressionEnabled ?? true,
      echoCancellationEnabled: user?.echoCancellationEnabled ?? true,
      autoGainControlEnabled: user?.autoGainControlEnabled ?? true,
    });
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setAudioPreferences((current) => ({
      ...current,
      pushToTalkEnabled: user.pushToTalkEnabled ?? current.pushToTalkEnabled,
      voiceActivationEnabled: user.voiceActivationEnabled ?? current.voiceActivationEnabled,
      noiseSuppression: user.noiseSuppressionEnabled ?? current.noiseSuppression,
      echoCancellation: user.echoCancellationEnabled ?? current.echoCancellation,
      autoGainControl: user.autoGainControlEnabled ?? current.autoGainControl,
    }));
  }, [user]);

  useEffect(() => {
    setChannelSettingsDrafts((current) => {
      const next: Record<string, { name: string; isPrivate: boolean; password: string }> = {};
      for (const channel of channels) {
        next[channel.id] = current[channel.id] ?? {
          name: channel.name,
          isPrivate: channel.isPrivate,
          password: '',
        };
      }
      return next;
    });
  }, [channels]);

  useEffect(() => {
    setAudioPreferences((current) => ({
      ...current,
      pushToTalkEnabled: profileForm.pushToTalkEnabled,
      voiceActivationEnabled: profileForm.voiceActivationEnabled,
      noiseSuppression: profileForm.noiseSuppressionEnabled,
      echoCancellation: profileForm.echoCancellationEnabled,
      autoGainControl: profileForm.autoGainControlEnabled,
    }));
  }, [
    profileForm.pushToTalkEnabled,
    profileForm.voiceActivationEnabled,
    profileForm.noiseSuppressionEnabled,
    profileForm.echoCancellationEnabled,
    profileForm.autoGainControlEnabled,
  ]);

  useEffect(() => {
    if (profileForm.noiseSuppressionEnabled && profileForm.echoCancellationEnabled && profileForm.autoGainControlEnabled) {
      setAudioEnhancementMode((current) => (current === 'studio' ? 'balanced' : current));
      return;
    }

    if (!profileForm.noiseSuppressionEnabled && !profileForm.echoCancellationEnabled && !profileForm.autoGainControlEnabled) {
      setAudioEnhancementMode('studio');
    }
  }, [
    profileForm.noiseSuppressionEnabled,
    profileForm.echoCancellationEnabled,
    profileForm.autoGainControlEnabled,
  ]);

  useEffect(() => {
    if (selectedInputDeviceId === 'default' && inputDevices[0]?.deviceId) {
      setSelectedInputDeviceId(inputDevices[0].deviceId);
    }
  }, [inputDevices, selectedInputDeviceId]);

  useEffect(() => {
    if (selectedOutputDeviceId === 'default' && outputDevices[0]?.deviceId) {
      setSelectedOutputDeviceId(outputDevices[0].deviceId);
    }
  }, [outputDevices, selectedOutputDeviceId]);

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const nextSocket = createRealtimeSocket(token);
    socketRef.current = nextSocket;

    nextSocket.on('connect', () => {
      setStatus(i18n.realtimeConnected);
    });

    nextSocket.on('disconnect', () => {
      setStatus(i18n.realtimeDisconnected);
      setParticipants([]);
    });

    nextSocket.on('session.ready', (payload: { turn: { url: string; username?: string; password?: string } }) => {
      setStatus(`${i18n.turnReady}: ${payload.turn.url}`);
      setRtcConfig({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          {
            urls: payload.turn.url,
            username: payload.turn.username,
            credential: payload.turn.password,
          },
        ],
      });
    });

    nextSocket.on('voice:participants', (list: VoiceParticipant[]) => {
      participantSocketsRef.current = new Map(
        list
          .filter((participant) => Boolean(participant.socketId))
          .map((participant) => [participant.userId, participant.socketId as string]),
      );
      setParticipants(list);
      syncPeerConnections(list);
    });

    nextSocket.on('voice:state', (payload: { state: VoiceParticipant }) => {
      if (payload.state.socketId) {
        participantSocketsRef.current.set(payload.state.userId, payload.state.socketId);
      }
      setParticipants((current) => {
        const next = current.filter((participant) => participant.userId !== payload.state.userId);
        return [...next, payload.state];
      });
    });

    nextSocket.on('metrics:updated', (payload: { userId: string; metrics: ConnectionMetrics }) => {
      setMetrics((current) => ({
        ...current,
        [payload.userId]: payload.metrics,
      }));
    });

    nextSocket.on('presence:online', (payload: { onlineUserIds: string[] }) => {
      setOnlineUserIds(payload.onlineUserIds);
    });

    nextSocket.on('screen-share:started', (payload: { sourceName: string; userId: string }) => {
      setActiveScreenShares((current) => ({
        ...current,
        [payload.userId]: payload.sourceName,
      }));
      setStatus(`${i18n.screenShare}: ${payload.sourceName}`);
      if (payload.userId !== user?.id) {
        pushNotification(
          language === 'ru' ? 'Запущена демонстрация экрана' : 'Screen share started',
          `${peerLabel(payload.userId)}: ${payload.sourceName}`,
          'soft',
        );
      }
    });

    nextSocket.on('screen-share:stopped', (payload: { userId: string }) => {
      setActiveScreenShares((current) => {
        const next = { ...current };
        delete next[payload.userId];
        return next;
      });
      setStatus('Screen share stopped');
      if (payload.userId !== user?.id) {
        pushNotification(
          language === 'ru' ? 'Демонстрация экрана остановлена' : 'Screen share stopped',
          peerLabel(payload.userId),
          'soft',
        );
      }
    });

    nextSocket.on('signal:sdp', (payload: SignalingDescription) => {
      updatePeerDebug(payload.fromUserId, (current) => ({
        ...current,
        lastEvent: `sdp-received:${payload.description.type ?? 'unknown'}`,
        updatedAt: new Date().toISOString(),
      }));
      void handleRemoteDescription(payload);
    });

    nextSocket.on('signal:ice', (payload: SignalingIce) => {
      void handleRemoteIce(payload);
    });

    setSocket(nextSocket);

    return () => {
      socketRef.current = null;
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [token, user]);

  useEffect(() => {
    if (!token) {
      return;
    }

    void loadServers(token);
    void loadFriends(token);
    void loadFriendRequests(token);
    void loadConversations(token);
  }, [token]);

  useEffect(() => {
    if (!token || !selectedConversationId) {
      setDirectMessages([]);
      return;
    }

    void loadDirectMessages(token, selectedConversationId);
  }, [token, selectedConversationId]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadFriends(token);
      void loadFriendRequests(token);
      void loadConversations(token);
    }, 12000);

    return () => window.clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!token || !selectedServerId) {
      previousServerMessageSnapshotRef.current = {};
      return;
    }

    void pollServerChannelNotifications(token, selectedServerId);
    const interval = window.setInterval(() => {
      void pollServerChannelNotifications(token, selectedServerId);
    }, 12000);

    return () => window.clearInterval(interval);
  }, [
    token,
    selectedServerId,
    channels,
    canCreateChannel,
    unlockedChannelIds,
    language,
    i18n.unknownUser,
    selectedTextChannelId,
    user?.id,
  ]);

  useEffect(() => {
    setChannels([]);
    setMessages([]);
    setSelectedChannelId('');
    setSelectedTextChannelId('');
    setError('');
  }, [selectedServerId]);

  useEffect(() => {
    if (!token || !selectedServerId) {
      setChannels([]);
      setServerMembers([]);
      return;
    }

    void loadChannels(token, selectedServerId);
    void loadServerMembers(token, selectedServerId);
  }, [token, selectedServerId]);

  useEffect(() => {
    setServerSettingsForm({
      name: selectedServer?.name ?? '',
      description: selectedServer?.description ?? '',
    });
  }, [selectedServer?.id, selectedServer?.name, selectedServer?.description]);

  useEffect(() => {
    const incomingCount = friendRequests.filter((request) => request.direction === 'incoming').length;
    if (previousIncomingRequestCountRef.current && incomingCount > previousIncomingRequestCountRef.current) {
      pushNotification(
        language === 'ru' ? 'Новая заявка в друзья' : 'New friend request',
        language === 'ru' ? `Входящих заявок: ${incomingCount}` : `Incoming requests: ${incomingCount}`,
        'alert',
      );
    }
    previousIncomingRequestCountRef.current = incomingCount;
  }, [friendRequests, language]);

  useEffect(() => {
    const nextFriendIds = friends.map((friend) => friend.id);
    const previousFriendIds = previousFriendIdsRef.current;
    if (previousFriendIds.length > 0) {
      const newFriend = friends.find((friend) => !previousFriendIds.includes(friend.id));
      if (newFriend) {
        pushNotification(
          language === 'ru' ? 'Новый друг' : 'New friend',
          language === 'ru'
            ? `${newFriend.displayName ?? newFriend.username} теперь у тебя в друзьях`
            : `${newFriend.displayName ?? newFriend.username} is now on your friends list`,
          'soft',
        );
      }
    }
    previousFriendIdsRef.current = nextFriendIds;
  }, [friends, language]);

  useEffect(() => {
    const snapshot: Record<string, string> = {};
    for (const conversation of conversations) {
      if (conversation.lastMessage?.id) {
        snapshot[conversation.id] = conversation.lastMessage.id;
      }
    }

    const previous = previousConversationSnapshotRef.current;
    if (Object.keys(previous).length > 0) {
      for (const conversation of conversations) {
        const lastMessage = conversation.lastMessage;
        if (!lastMessage?.id) {
          continue;
        }
        if (previous[conversation.id] && previous[conversation.id] !== lastMessage.id && lastMessage.author?.id !== user?.id) {
          pushNotification(
            language === 'ru' ? 'Новое личное сообщение' : 'New direct message',
            `${conversation.participant?.displayName ?? i18n.unknownUser}: ${lastMessage.content}`,
            'soft',
          );
        }
      }
    }
    previousConversationSnapshotRef.current = snapshot;
  }, [conversations, i18n.unknownUser, language, user?.id]);

  useEffect(() => {
    if (!connectedVoiceSession) {
      previousVoiceParticipantIdsRef.current = [];
      return;
    }

    const otherParticipantIds = participants
      .map((participant) => participant.userId)
      .filter((participantUserId) => participantUserId !== user?.id);
    const previous = previousVoiceParticipantIdsRef.current;

    if (previous.length > 0 || otherParticipantIds.length > 0) {
      const joined = otherParticipantIds.filter((participantUserId) => !previous.includes(participantUserId));
      const left = previous.filter((participantUserId) => !otherParticipantIds.includes(participantUserId));

      for (const participantUserId of joined) {
        pushNotification(
          language === 'ru' ? 'Участник вошёл в голосовой канал' : 'Participant joined voice',
          peerLabel(participantUserId),
          'soft',
        );
      }

      for (const participantUserId of left) {
        pushNotification(
          language === 'ru' ? 'Участник вышел из голосового канала' : 'Participant left voice',
          peerLabel(participantUserId),
          'soft',
        );
      }
    }

    previousVoiceParticipantIdsRef.current = otherParticipantIds;
  }, [connectedVoiceSession, participants, language, user?.id]);

  useEffect(() => {
    const moderation = currentServerMember?.moderation;
    if (!moderation) {
      previousModerationSnapshotRef.current = '';
      return;
    }

    const snapshot = JSON.stringify({
      isBanned: moderation.isBanned,
      isMuted: moderation.isMuted,
      isDeafened: moderation.isDeafened,
      isScreenShareBlocked: moderation.isScreenShareBlocked,
    });

    if (previousModerationSnapshotRef.current) {
      const previous = JSON.parse(previousModerationSnapshotRef.current) as {
        isBanned: boolean;
        isMuted: boolean;
        isDeafened: boolean;
        isScreenShareBlocked: boolean;
      };

      if (!previous.isMuted && moderation.isMuted) {
        pushNotification(
          language === 'ru' ? 'Микрофон отключён' : 'Microphone muted',
          language === 'ru' ? 'Владелец или администратор сервера отключил твой микрофон.' : 'A server moderator muted your microphone.',
          'alert',
        );
      }
      if (!previous.isDeafened && moderation.isDeafened) {
        pushNotification(
          language === 'ru' ? 'Звук отключён' : 'Audio disabled',
          language === 'ru' ? 'Владелец или администратор сервера отключил тебе звук.' : 'A server moderator deafened you.',
          'alert',
        );
      }
      if (!previous.isScreenShareBlocked && moderation.isScreenShareBlocked) {
        pushNotification(
          language === 'ru' ? 'Демонстрация экрана запрещена' : 'Screen share blocked',
          language === 'ru' ? 'На этом сервере тебе временно запрещена демонстрация экрана.' : 'Screen sharing was temporarily disabled for you on this server.',
          'alert',
        );
      }
      if (!previous.isBanned && moderation.isBanned) {
        pushNotification(
          language === 'ru' ? 'Доступ к серверу ограничен' : 'Server access restricted',
          language === 'ru' ? 'Ты временно заблокирован на сервере.' : 'You were temporarily banned from this server.',
          'alert',
        );
      }
    }

    previousModerationSnapshotRef.current = snapshot;
  }, [currentServerMember, language]);

  useEffect(() => {
    if (!token || !selectedServerId || !selectedChannel || selectedChannel.type !== 'text') {
      if (workspaceMode !== 'servers' || !linkedTextChannel) {
        setMessages([]);
        return;
      }
    }

    const targetChannelId = selectedChannel?.type === 'text' ? selectedChannel.id : linkedTextChannel?.id;
    if (!targetChannelId || !selectedServerId || !token || workspaceMode !== 'servers') {
      setMessages([]);
      return;
    }

    void loadMessages(token, selectedServerId, targetChannelId);
  }, [linkedTextChannel?.id, selectedChannel, selectedServerId, token, workspaceMode]);

  useEffect(() => {
    if (!selectedTextChannelId && linkedTextChannel) {
      setSelectedTextChannelId(linkedTextChannel.id);
      return;
    }

    if (selectedTextChannelId && !textChannels.find((channel) => channel.id === selectedTextChannelId) && linkedTextChannel) {
      setSelectedTextChannelId(linkedTextChannel.id);
    }
  }, [linkedTextChannel, selectedTextChannelId, textChannels]);

  useEffect(() => {
    if (!screenShareEnabled || !previewVideoRef.current || !displayStreamRef.current) {
      return;
    }

    previewVideoRef.current.srcObject = displayStreamRef.current;
  }, [screenShareEnabled]);

  useEffect(() => {
    if (!microphoneStreamRef.current) {
      return;
    }

    void rebuildOutboundAudioStream();
    void renegotiatePeers();
  }, [audioControlForm.inputLevel, shareSystemAudioEnabled, selectedInputDeviceId, audioEnhancementMode]);

  useEffect(() => {
    if (!socket || !selectedChannel || selectedChannel.type !== 'voice') {
      return;
    }

    const interval = window.setInterval(() => {
      void publishConnectionMetrics(selectedChannel.id);
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [socket, selectedChannel, user?.id]);

  useEffect(() => {
    const selfParticipant = participants.find((participant) => participant.userId === user?.id);
    if (!selfParticipant) {
      return;
    }

    setVoiceFlags((current) => {
      const next = {
        ...current,
        muted: selfParticipant.muted,
        deafened: selfParticipant.deafened,
        speaking: selfParticipant.speaking,
        pushToTalkActive: selfParticipant.pushToTalkActive,
        voiceActivationActive: selfParticipant.voiceActivationActive,
      };
      applyLocalAudioTrackState(next);
      return next;
    });
  }, [participants, user?.id]);

  useEffect(() => {
    applyLocalAudioTrackState(voiceFlags);
  }, [
    voiceFlags.muted,
    voiceFlags.deafened,
    voiceFlags.speaking,
    voiceFlags.pushToTalkActive,
    voiceFlags.voiceActivationActive,
  ]);

  useEffect(() => {
    if (!connectedVoiceSession || !currentServerMember?.moderation) {
      return;
    }

    if (currentServerMember.moderation.isBanned && connectedVoiceSession.serverId === selectedServerId) {
      leaveVoiceChannel();
      setError(language === 'ru' ? 'Вы временно заблокированы на сервере.' : 'You are temporarily banned from this server.');
      return;
    }

    if (currentServerMember.moderation.isScreenShareBlocked && screenShareEnabled) {
      stopScreenShare();
    }

    const nextState: Partial<VoiceFlags> = {};
    if (currentServerMember.moderation.isMuted && !voiceFlags.muted) {
      nextState.muted = true;
    }
    if (currentServerMember.moderation.isDeafened && !voiceFlags.deafened) {
      nextState.deafened = true;
    }

    if (Object.keys(nextState).length > 0) {
      emitVoiceState(nextState);
    }
  }, [
    connectedVoiceSession,
    currentServerMember,
    language,
    screenShareEnabled,
    selectedServerId,
    voiceFlags.deafened,
    voiceFlags.muted,
  ]);

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
      const list = await api.getFriends(currentToken);
      setFriends(list);
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function loadFriendRequests(currentToken: string) {
    try {
      const list = await api.getFriendRequests(currentToken);
      setFriendRequests(list);
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
      const list = await api.getDirectMessages(currentToken, conversationId);
      setDirectMessages(list);
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function pollServerChannelNotifications(currentToken: string, serverId: string) {
    const visibleTextChannels = channels.filter(
      (channel) =>
        channel.type === 'text' && (!channel.isPrivate || canCreateChannel || unlockedChannelIds.includes(channel.id)),
    );

    if (visibleTextChannels.length === 0) {
      previousServerMessageSnapshotRef.current = {};
      return;
    }

    const nextSnapshot: Record<string, string> = {};
    const previousSnapshot = previousServerMessageSnapshotRef.current;
    const isBaseline = Object.keys(previousSnapshot).length === 0;

    for (const channel of visibleTextChannels) {
      try {
        const list = await api.getMessages(currentToken, serverId, channel.id);
        const lastMessage = list[list.length - 1];
        if (!lastMessage?.id) {
          continue;
        }

        nextSnapshot[channel.id] = lastMessage.id;
        if (
          !isBaseline &&
          previousSnapshot[channel.id] &&
          previousSnapshot[channel.id] !== lastMessage.id &&
          lastMessage.author?.id !== user?.id
        ) {
          pushNotification(
            language === 'ru' ? 'Новое сообщение в канале' : 'New channel message',
            `${channel.name}: ${lastMessage.author?.displayName ?? lastMessage.author?.username ?? i18n.unknownUser} — ${lastMessage.content}`,
            channel.id === selectedTextChannelId ? 'soft' : 'alert',
          );
        }
      } catch {
        // Ignore notification polling failures for individual channels.
      }
    }

    previousServerMessageSnapshotRef.current = nextSnapshot;
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
    if (!token) {
      return;
    }

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
    if (!token || !joinServerForm.serverId.trim()) {
      return;
    }

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
      setJoinServerForm({ serverId: '' });
      setStatus(`${i18n.joinedServer} ${server.name}`);
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleCreateChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedServerId || !canCreateChannel) {
      return;
    }

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
    if (!token || !selectedServerId || !canManageServer) {
      return;
    }

    try {
      const server = await api.updateServer(token, selectedServerId, serverSettingsForm);
      setServers((current) => current.map((item) => (item.id === server.id ? server : item)));
      setStatus(`${i18n.serverUpdated}: ${server.name}`);
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleRemoveMember(memberUserId: string) {
    if (!token || !selectedServerId || !canManageServer) {
      return;
    }

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
  ) {
    if (!token || !selectedServerId || !canManageServer) {
      return;
    }

    try {
      await api.moderateServerMember(token, selectedServerId, memberUserId, { action, durationMinutes });
      await loadServerMembers(token, selectedServerId);
      setSelectedMemberActionUserId(memberUserId);
      pushToast(
        language === 'ru'
          ? action.startsWith('clear_')
            ? 'Ограничение снято'
            : 'Ограничение применено'
          : action.startsWith('clear_')
            ? 'Restriction cleared'
            : 'Restriction applied',
      );
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleClearMemberRestrictions(memberUserId: string) {
    if (!token || !selectedServerId || !canManageServer) {
      return;
    }

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

  async function handleRemoveChannel() {
    if (!token || !selectedServerId || !selectedChannelId || !canCreateChannel) {
      return;
    }

    try {
      await api.removeChannel(token, selectedServerId, selectedChannelId);
      setChannels((current) => {
        const next = current.filter((channel) => channel.id !== selectedChannelId);
        setSelectedChannelId(next[0]?.id ?? '');
        return next;
      });
      setStatus(i18n.channelRemoved);
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleRemoveSpecificChannel(channelId: string) {
    if (!token || !selectedServerId || !canCreateChannel) {
      return;
    }

    try {
      await api.removeChannel(token, selectedServerId, channelId);
      setChannels((current) => current.filter((channel) => channel.id !== channelId));
      setChannelSettingsDrafts((current) => {
        const next = { ...current };
        delete next[channelId];
        return next;
      });
      if (selectedChannelId === channelId) {
        setSelectedChannelId('');
      }
      pushToast(language === 'ru' ? 'Канал удалён' : 'Channel removed');
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleUpdateChannel(channelId: string) {
    if (!token || !selectedServerId || !canManageServer) {
      return;
    }

    const draft = channelSettingsDrafts[channelId];
    if (!draft) {
      return;
    }

    try {
      const updated = await api.updateChannel(token, selectedServerId, channelId, {
        name: draft.name,
        isPrivate: draft.isPrivate,
        password: draft.password || undefined,
      });

      setChannels((current) => current.map((channel) => (channel.id === channelId ? updated : channel)));
      setChannelSettingsDrafts((current) => ({
        ...current,
        [channelId]: {
          name: updated.name,
          isPrivate: updated.isPrivate,
          password: '',
        },
      }));
      pushToast(language === 'ru' ? 'Канал обновлён' : 'Channel updated');
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleSelectChannel(channel: Channel) {
    if (!token || !selectedServerId) {
      return;
    }

    if (!channel.isPrivate || canCreateChannel || unlockedChannelIds.includes(channel.id)) {
      setError('');
      setSelectedChannelId(channel.id);
      if (channel.type === 'text') {
        setSelectedTextChannelId(channel.id);
      }
      setChannelAccessForm({ channelId: '', password: '' });
      return;
    }

    setChannelAccessForm({ channelId: channel.id, password: '' });
  }

  async function handleUnlockChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selectedServerId || !channelAccessForm.channelId) {
      return;
    }

    try {
      await api.accessChannel(token, selectedServerId, channelAccessForm.channelId, channelAccessForm.password);
      setUnlockedChannelIds((current) =>
        current.includes(channelAccessForm.channelId) ? current : [...current, channelAccessForm.channelId],
      );
      setSelectedChannelId(channelAccessForm.channelId);
      const unlockedChannel = channels.find((channel) => channel.id === channelAccessForm.channelId);
      if (unlockedChannel?.type === 'text') {
        setSelectedTextChannelId(unlockedChannel.id);
      }
      setChannelAccessForm({ channelId: '', password: '' });
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  function cleanupMixedAudio() {
    mixedAudioStreamRef.current?.getTracks().forEach((track) => track.stop());
    mixedAudioStreamRef.current = null;
    mixedAudioContextRef.current?.close().catch(() => undefined);
    mixedAudioContextRef.current = null;
  }

  function stopDisplayStreamTracks(stream: MediaStream | null) {
    stream?.getTracks().forEach((track) => {
      try {
        track.onended = null;
        track.stop();
      } catch {
        // Ignore best-effort media shutdown failures to avoid collapsing the UI.
      }
    });
  }

  async function rebuildOutboundAudioStream() {
    const microphoneStream = microphoneStreamRef.current;
    const displayStream = displayStreamRef.current;
    const displayAudioTrack = shareSystemAudioEnabled ? displayStream?.getAudioTracks()[0] : undefined;

    cleanupMixedAudio();
    microphoneGainNodeRef.current = null;

    if (!microphoneStream) {
      audioStreamRef.current = null;
      return;
    }

    if (!displayAudioTrack && audioControlForm.inputLevel === 100 && audioEnhancementMode === 'studio') {
      audioStreamRef.current = microphoneStream;
      return;
    }

    try {
      const mixedContext = new AudioContext();
      await mixedContext.resume().catch(() => undefined);
      const destination = mixedContext.createMediaStreamDestination();
      const processed = await buildProcessedMicrophoneGraph(mixedContext, microphoneStream, {
        inputLevel: audioControlForm.inputLevel,
        mode: audioEnhancementMode,
      });
      microphoneGainNodeRef.current = processed.inputGain;
      processed.output.connect(destination);

      if (displayAudioTrack) {
        const displaySource = mixedContext.createMediaStreamSource(new MediaStream([displayAudioTrack]));
        displaySource.connect(destination);
      }

      mixedAudioContextRef.current = mixedContext;
      mixedAudioStreamRef.current = destination.stream;
      audioStreamRef.current = destination.stream;
      applyLocalAudioTrackState(voiceFlags);
    } catch (nextError) {
      audioStreamRef.current = microphoneStream;
      applyLocalAudioTrackState(voiceFlags);
      setError(asMessage(nextError));
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const targetChannelId = selectedChannel?.type === 'text' ? selectedChannel.id : linkedTextChannel?.id;
    if (!token || !selectedServerId || !targetChannelId || !messageDraft.trim()) {
      return;
    }

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
    if (!token || !userSearchQuery.trim()) {
      return;
    }

    try {
      const results = await api.searchUsers(token, userSearchQuery.trim());
      setUserSearchResults(results);
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleSendFriendRequest(target: string) {
    if (!token) {
      return;
    }

    try {
      await api.sendFriendRequest(token, target);
      await loadFriendRequests(token);
      pushToast(language === 'ru' ? 'Заявка отправлена' : 'Request sent');
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleAcceptFriendRequest(requestId: string) {
    if (!token) {
      return;
    }

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
    if (!token) {
      return;
    }

    try {
      await api.removeFriend(token, friendUserId);
      await loadFriends(token);
      await loadConversations(token);
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleOpenConversation(otherUserId: string) {
    if (!token) {
      return;
    }

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
    if (!token || !selectedConversationId || !directMessageDraft.trim()) {
      return;
    }

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

  async function handleUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    try {
      const nextUser = await api.updateProfile(token, profileForm);
      setUser(nextUser);
      setAudioPreferences((current) => ({
        ...current,
        pushToTalkEnabled: nextUser.pushToTalkEnabled ?? current.pushToTalkEnabled,
        voiceActivationEnabled: nextUser.voiceActivationEnabled ?? current.voiceActivationEnabled,
        noiseSuppression: nextUser.noiseSuppressionEnabled ?? current.noiseSuppression,
        echoCancellation: nextUser.echoCancellationEnabled ?? current.echoCancellation,
        autoGainControl: nextUser.autoGainControlEnabled ?? current.autoGainControl,
      }));
      setStatus(`${i18n.profileSettings}: ${nextUser.displayName}`);
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  async function handleAvatarFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError(language === 'ru' ? 'Поддерживаются PNG, JPEG и WEBP' : 'Supported formats: PNG, JPEG and WEBP');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarEditor({
          source: reader.result as string,
          scale: 1,
          offsetX: 0,
          offsetY: 0,
        });
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  function applyAvatarEditor() {
    if (!avatarEditor) {
      return;
    }

    const image = new Image();
    image.onload = () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }

      context.clearRect(0, 0, size, size);
      context.save();
      context.beginPath();
      context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      context.closePath();
      context.clip();

      const baseScale = Math.max(size / image.width, size / image.height);
      const finalScale = baseScale * avatarEditor.scale;
      const drawWidth = image.width * finalScale;
      const drawHeight = image.height * finalScale;
      const x = (size - drawWidth) / 2 + avatarEditor.offsetX;
      const y = (size - drawHeight) / 2 + avatarEditor.offsetY;
      context.drawImage(image, x, y, drawWidth, drawHeight);
      context.restore();

      const dataUrl = canvas.toDataURL('image/png');
      setProfileForm((current) => ({ ...current, avatarUrl: dataUrl }));
      setAvatarEditor(null);
      setStatus(language === 'ru' ? 'Фото выбрано' : 'Image selected');
    };
    image.src = avatarEditor.source;
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

  function createPeerConnection(remoteUserId: string) {
    const existing = peerConnectionsRef.current.get(remoteUserId);
    if (existing) {
      return existing;
    }

    const pc = new RTCPeerConnection(rtcConfig);
    ensureTransceiver(pc, 'audio');
    ensureTransceiver(pc, 'video');
    peerConnectionsRef.current.set(remoteUserId, pc);
    updatePeerDebug(remoteUserId, () => createDefaultPeerDebug(remoteUserId, pc, 'peer-created'));

    pc.onicecandidate = (event) => {
      if (!event.candidate || !socketRef.current || !activeVoiceChannelIdRef.current) {
        return;
      }

      socketRef.current.emit(
        'signal:ice',
        {
          channelId: activeVoiceChannelIdRef.current,
          targetUserId: remoteUserId,
          targetSocketId: participantSocketsRef.current.get(remoteUserId),
          candidate: event.candidate.toJSON(),
        },
        (response?: { ok?: boolean; reason?: string }) => {
          if (!response?.ok) {
            updatePeerDebug(remoteUserId, (current) => ({
              ...current,
              lastEvent: `ice-failed:${response?.reason ?? 'unknown'}`,
              updatedAt: new Date().toISOString(),
            }));
          }
        },
      );
      updatePeerDebug(remoteUserId, (current) => ({
        ...current,
        iceSent: current.iceSent + 1,
        lastEvent: 'ice-sent',
        updatedAt: new Date().toISOString(),
      }));
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0] ?? new MediaStream([event.track]);
      const isVideo = event.track.kind === 'video';

      setRemoteMedia((current) => ({
        ...current,
        [remoteUserId]: {
          ...current[remoteUserId],
          userId: remoteUserId,
          ...(isVideo ? { screenStream: stream } : { audioStream: stream }),
        },
      }));
      updatePeerDebug(remoteUserId, (current) => ({
        ...current,
        remoteAudioTrack: current.remoteAudioTrack || event.track.kind === 'audio',
        remoteVideoTrack: current.remoteVideoTrack || event.track.kind === 'video',
        lastEvent: `track-${event.track.kind}`,
        updatedAt: new Date().toISOString(),
      }));
    };

    pc.onconnectionstatechange = () => {
      syncPeerConnectionDebug(remoteUserId, pc, 'connection-state');
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
        setRemoteMedia((current) => {
          const next = { ...current };
          delete next[remoteUserId];
          return next;
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      syncPeerConnectionDebug(remoteUserId, pc, 'ice-connection-state');
    };

    pc.onsignalingstatechange = () => {
      syncPeerConnectionDebug(remoteUserId, pc, 'signaling-state');
    };

    pc.onnegotiationneeded = () => {
      void sendOffer(remoteUserId, pc);
    };

    void syncLocalTracksToPeer(pc);
    void flushPendingIce(remoteUserId, pc);

    return pc;
  }

  function ensureTransceiver(pc: RTCPeerConnection, kind: 'audio' | 'video') {
    const existing = pc.getTransceivers().find((transceiver) => transceiver.receiver.track.kind === kind);
    return existing ?? pc.addTransceiver(kind, { direction: 'sendrecv' });
  }

  async function syncLocalTracksToPeer(pc: RTCPeerConnection) {
    const audioTransceiver = ensureTransceiver(pc, 'audio');
    const videoTransceiver = ensureTransceiver(pc, 'video');
    const nextAudioTrack = audioStreamRef.current?.getAudioTracks()[0] ?? null;
    const nextVideoTrack = displayStreamRef.current?.getVideoTracks()[0] ?? null;

    await Promise.all([
      audioTransceiver.sender.replaceTrack(nextAudioTrack),
      videoTransceiver.sender.replaceTrack(nextVideoTrack),
    ]);
    for (const [remoteUserId, currentPc] of peerConnectionsRef.current.entries()) {
      if (currentPc === pc) {
        syncPeerConnectionDebug(remoteUserId, pc, 'local-tracks-synced');
      }
    }
  }

  async function sendOffer(remoteUserId: string, pc: RTCPeerConnection) {
    if (
      !socketRef.current ||
      !activeVoiceChannelIdRef.current ||
      makingOfferRef.current.has(remoteUserId) ||
      pc.signalingState !== 'stable'
    ) {
      return;
    }

    try {
      makingOfferRef.current.add(remoteUserId);
      await syncLocalTracksToPeer(pc);
      await pc.setLocalDescription(await pc.createOffer());
      updatePeerDebug(remoteUserId, (current) => ({
        ...current,
        offersSent: current.offersSent + 1,
        localDescriptionType: pc.localDescription?.type ?? current.localDescriptionType,
        lastEvent: 'offer-sent',
        updatedAt: new Date().toISOString(),
      }));
      socketRef.current.emit(
        'signal:sdp',
        {
          channelId: activeVoiceChannelIdRef.current,
          targetUserId: remoteUserId,
          targetSocketId: participantSocketsRef.current.get(remoteUserId),
          description: pc.localDescription?.toJSON(),
        },
        (response?: { ok?: boolean; reason?: string }) => {
          if (!response?.ok) {
            updatePeerDebug(remoteUserId, (current) => ({
              ...current,
              lastEvent: `offer-failed:${response?.reason ?? 'unknown'}`,
              updatedAt: new Date().toISOString(),
            }));
          }
        },
      );
    } catch (nextError) {
      updatePeerDebug(remoteUserId, (current) => ({
        ...current,
        lastEvent: `offer-error:${asMessage(nextError)}`,
        updatedAt: new Date().toISOString(),
      }));
      setError(asMessage(nextError));
    } finally {
      makingOfferRef.current.delete(remoteUserId);
    }
  }

  async function handleRemoteDescription(payload: SignalingDescription) {
    if (payload.channelId !== activeVoiceChannelIdRef.current || payload.fromUserId === user?.id) {
      return;
    }

    const pc = createPeerConnection(payload.fromUserId);
    const description = new RTCSessionDescription(payload.description);
    const isOffer = description.type === 'offer';
    const offerCollision = isOffer && (makingOfferRef.current.has(payload.fromUserId) || pc.signalingState !== 'stable');

    ignoredOfferRef.current.delete(payload.fromUserId);
    if (offerCollision && (user?.id ?? '') < payload.fromUserId) {
      ignoredOfferRef.current.add(payload.fromUserId);
      return;
    }

    try {
      if (offerCollision) {
        await pc.setLocalDescription({ type: 'rollback' });
      }

      await pc.setRemoteDescription(description);
      syncPeerConnectionDebug(payload.fromUserId, pc, `remote-${description.type}`);
      await flushPendingIce(payload.fromUserId, pc);

      if (description.type === 'offer') {
        await syncLocalTracksToPeer(pc);
        await pc.setLocalDescription(await pc.createAnswer());
        updatePeerDebug(payload.fromUserId, (current) => ({
          ...current,
          answersSent: current.answersSent + 1,
          localDescriptionType: pc.localDescription?.type ?? current.localDescriptionType,
          lastEvent: 'answer-sent',
          updatedAt: new Date().toISOString(),
        }));
        socketRef.current?.emit(
          'signal:sdp',
          {
            channelId: payload.channelId,
            targetUserId: payload.fromUserId,
            targetSocketId: participantSocketsRef.current.get(payload.fromUserId),
            description: pc.localDescription?.toJSON(),
          },
          (response?: { ok?: boolean; reason?: string }) => {
            if (!response?.ok) {
              updatePeerDebug(payload.fromUserId, (current) => ({
                ...current,
                lastEvent: `answer-failed:${response?.reason ?? 'unknown'}`,
                updatedAt: new Date().toISOString(),
              }));
            }
          },
        );
      }
    } catch (nextError) {
      updatePeerDebug(payload.fromUserId, (current) => ({
        ...current,
        lastEvent: `remote-description-error:${asMessage(nextError)}`,
        updatedAt: new Date().toISOString(),
      }));
      setError(asMessage(nextError));
    }
  }

  async function handleRemoteIce(payload: SignalingIce) {
    if (payload.channelId !== activeVoiceChannelIdRef.current || payload.fromUserId === user?.id) {
      return;
    }

    if (ignoredOfferRef.current.has(payload.fromUserId)) {
      return;
    }

    const pc = peerConnectionsRef.current.get(payload.fromUserId);
    if (!pc || !pc.remoteDescription) {
      const queue = pendingIceRef.current.get(payload.fromUserId) ?? [];
      queue.push(payload.candidate);
      pendingIceRef.current.set(payload.fromUserId, queue);
      updatePeerDebug(payload.fromUserId, (current) => ({
        ...current,
        iceReceived: current.iceReceived + 1,
        pendingIce: queue.length,
        lastEvent: 'ice-queued',
        updatedAt: new Date().toISOString(),
      }));
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      updatePeerDebug(payload.fromUserId, (current) => ({
        ...current,
        iceReceived: current.iceReceived + 1,
        pendingIce: 0,
        lastEvent: 'ice-applied',
        updatedAt: new Date().toISOString(),
      }));
    } catch (nextError) {
      updatePeerDebug(payload.fromUserId, (current) => ({
        ...current,
        lastEvent: `ice-error:${asMessage(nextError)}`,
        updatedAt: new Date().toISOString(),
      }));
      setError(asMessage(nextError));
    }
  }

  async function flushPendingIce(remoteUserId: string, pc: RTCPeerConnection) {
    if (!pc.remoteDescription) {
      return;
    }

    const queued = pendingIceRef.current.get(remoteUserId) ?? [];
    pendingIceRef.current.delete(remoteUserId);
    for (const candidate of queued) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    if (queued.length > 0) {
      updatePeerDebug(remoteUserId, (current) => ({
        ...current,
        pendingIce: 0,
        lastEvent: 'queued-ice-flushed',
        updatedAt: new Date().toISOString(),
      }));
    }
  }

  function syncPeerConnections(list: VoiceParticipant[]) {
    if (!user || !audioStreamRef.current) {
      return;
    }

    const remoteParticipants = list.filter((participant) => participant.userId !== user.id);
    const remoteIds = new Set(remoteParticipants.map((participant) => participant.userId));
    let createdPeer = false;

    for (const participant of remoteParticipants) {
      setRemoteMedia((current) => ({
        ...current,
        [participant.userId]: current[participant.userId] ?? { userId: participant.userId },
      }));
      const existingPeer = peerConnectionsRef.current.get(participant.userId);
      createPeerConnection(participant.userId);
      if (!existingPeer) {
        createdPeer = true;
      }
    }

    for (const [remoteUserId, pc] of peerConnectionsRef.current.entries()) {
      if (!remoteIds.has(remoteUserId)) {
        pc.close();
        peerConnectionsRef.current.delete(remoteUserId);
        pendingIceRef.current.delete(remoteUserId);
        statsBytesRef.current.delete(remoteUserId);
        setPeerDebug((current) => {
          const next = { ...current };
          delete next[remoteUserId];
          return next;
        });
      }
    }

    setRemoteMedia((current) => {
      const next: Record<string, RemoteMedia> = {};
      for (const remoteUserId of remoteIds) {
        if (current[remoteUserId]) {
          next[remoteUserId] = current[remoteUserId];
        }
      }
      return next;
    });

    if (createdPeer && remoteIds.size > 0) {
      void renegotiatePeers();
    }
  }

  async function renegotiatePeers() {
    for (const [remoteUserId, pc] of peerConnectionsRef.current.entries()) {
      await syncLocalTracksToPeer(pc);
      if (pc.signalingState === 'stable') {
        await sendOffer(remoteUserId, pc);
      }
    }
  }

  async function publishConnectionMetrics(channelId: string) {
    if (!socketRef.current || peerConnectionsRef.current.size === 0) {
      return;
    }

    const values = await Promise.all(
      Array.from(peerConnectionsRef.current.entries()).map(([remoteUserId, pc]) =>
        collectPeerMetrics(remoteUserId, pc),
      ),
    );
    const available = values.filter(Boolean) as ConnectionMetrics[];
    if (available.length === 0) {
      return;
    }

    const metric: ConnectionMetrics = {
      rtt: averageMetric(available, 'rtt'),
      jitter: averageMetric(available, 'jitter'),
      packetLoss: averageMetric(available, 'packetLoss'),
      bitrate: averageMetric(available, 'bitrate'),
      updatedAt: new Date().toISOString(),
    };

    socketRef.current.emit('metrics:update', {
      channelId,
      ...metric,
    });
    setMetrics((current) => ({
      ...current,
      [user?.id ?? 'self']: metric,
    }));
    setNetworkTicker((value) => value + 1);
  }

  async function collectPeerMetrics(remoteUserId: string, pc: RTCPeerConnection): Promise<ConnectionMetrics | null> {
    const report = await pc.getStats();
    let rtt: number | undefined;
    let jitter: number | undefined;
    let packetsLost = 0;
    let packetsReceived = 0;
    let outboundBytes = 0;
    let timestamp = Date.now();

    report.forEach((stat) => {
      if (stat.type === 'candidate-pair' && stat.state === 'succeeded' && typeof stat.currentRoundTripTime === 'number') {
        rtt = Math.round(stat.currentRoundTripTime * 1000);
      }
      if (stat.type === 'inbound-rtp') {
        if (typeof stat.jitter === 'number') {
          jitter = Math.round(stat.jitter * 1000);
        }
        packetsLost += typeof stat.packetsLost === 'number' ? stat.packetsLost : 0;
        packetsReceived += typeof stat.packetsReceived === 'number' ? stat.packetsReceived : 0;
      }
      if (stat.type === 'outbound-rtp' && typeof stat.bytesSent === 'number') {
        outboundBytes += stat.bytesSent;
        timestamp = stat.timestamp;
      }
    });

    const previous = statsBytesRef.current.get(remoteUserId);
    statsBytesRef.current.set(remoteUserId, { bytes: outboundBytes, timestamp });
    const bitrate =
      previous && timestamp > previous.timestamp
        ? Math.round(((outboundBytes - previous.bytes) * 8) / ((timestamp - previous.timestamp) / 1000) / 1000)
        : undefined;
    const packetTotal = packetsLost + packetsReceived;

    return {
      rtt,
      jitter,
      packetLoss: packetTotal > 0 ? Number(((packetsLost / packetTotal) * 100).toFixed(2)) : undefined,
      bitrate,
      updatedAt: new Date().toISOString(),
    };
  }

  function averageMetric(values: ConnectionMetrics[], key: keyof Omit<ConnectionMetrics, 'updatedAt'>) {
    const numbers = values.map((value) => value[key]).filter((value): value is number => typeof value === 'number');
    if (numbers.length === 0) {
      return undefined;
    }

    return Math.round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length);
  }

  function closeAllPeers() {
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    pendingIceRef.current.clear();
    makingOfferRef.current.clear();
    ignoredOfferRef.current.clear();
    statsBytesRef.current.clear();
    setPeerDebug({});
    setRemoteMedia({});
    setActiveScreenShares({});
  }

  async function joinVoiceChannel() {
    if (!selectedChannel || selectedChannel.type !== 'voice' || !socket || !selectedServerId) {
      return;
    }

    try {
      activeVoiceChannelIdRef.current = selectedChannel.id;
      const mediaFlags = getMediaConstraintFlags(audioEnhancementMode);
      microphoneStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedInputDeviceId !== 'default' ? { exact: selectedInputDeviceId } : undefined,
          echoCancellation: mediaFlags.echoCancellation,
          noiseSuppression: mediaFlags.noiseSuppression,
          autoGainControl: mediaFlags.autoGainControl,
          channelCount: 1,
        },
      });
      await rebuildOutboundAudioStream();

      socket.emit('voice:join', { channelId: selectedChannel.id }, (response: { ok: boolean; reason?: string }) => {
        if (!response?.ok && response?.reason) {
          setError(response.reason);
          return;
        }

        setConnectedVoiceSession({
          channelId: selectedChannel.id,
          channelName: selectedChannel.name,
          serverId: selectedServerId,
        });
        void renegotiatePeers();
        setStatus(`${i18n.connectedToVoice} ${selectedChannel.name}`);
        pushToast(language === 'ru' ? `Подключено: ${selectedChannel.name}` : `Connected: ${selectedChannel.name}`);
      });
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  function leaveVoiceChannel() {
    if (!connectedVoiceSession || !socket) {
      return;
    }

    socket.emit('voice:leave', { channelId: connectedVoiceSession.channelId });
    microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
    microphoneStreamRef.current = null;
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
    stopDisplayStreamTracks(displayStreamRef.current);
    displayStreamRef.current = null;
    cleanupMixedAudio();
    closeAllPeers();
    activeVoiceChannelIdRef.current = '';
    setConnectedVoiceSession(null);
    setParticipants([]);
    setScreenShareEnabled(false);
    setScreenShareLabel('');
    setActiveScreenShares({});
    setStatus(`${i18n.disconnectedFrom} ${connectedVoiceSession.channelName}`);
    pushToast(language === 'ru' ? `Отключено: ${connectedVoiceSession.channelName}` : `Disconnected: ${connectedVoiceSession.channelName}`);
  }

  function emitVoiceState(nextState: Partial<VoiceFlags>) {
    if (!connectedVoiceSession || !socket) {
      return;
    }

    const merged = { ...voiceFlags, ...nextState };
    setVoiceFlags(merged);
    applyLocalAudioTrackState(merged);
    socket.emit('voice:state', {
      channelId: connectedVoiceSession.channelId,
      ...merged,
    });
  }

  async function startScreenShare() {
    if (!connectedVoiceSession || !socket) {
      return;
    }

    try {
      screenShareStoppingRef.current = false;
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: shareSystemAudioEnabled,
      });
      displayStreamRef.current = stream;
      await rebuildOutboundAudioStream();
      setScreenShareEnabled(true);
      const [videoTrack] = stream.getVideoTracks();
      const label = videoTrack?.label || 'screen';
      setScreenShareLabel(label);
      await renegotiatePeers();

      socket.emit(
        'screen-share:start',
        {
          channelId: connectedVoiceSession.channelId,
          sourceName: label,
          withSystemAudio: stream.getAudioTracks().length > 0,
        },
        (response: { ok: boolean; reason?: string }) => {
          if (!response?.ok && response?.reason) {
            stopScreenShare();
            setError(response.reason);
          }
        },
      );

      if (videoTrack) {
        videoTrack.onended = () => {
          if (!screenShareStoppingRef.current) {
            stopScreenShare();
          }
        };
      }
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  function stopScreenShare() {
    if (!connectedVoiceSession || !socket) {
      return;
    }

    if (screenShareStoppingRef.current) {
      return;
    }

    screenShareStoppingRef.current = true;
    stopDisplayStreamTracks(displayStreamRef.current);
    displayStreamRef.current = null;
    void rebuildOutboundAudioStream();
    void renegotiatePeers();
    setScreenShareEnabled(false);
    setScreenShareLabel('');
    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = null;
    }
    socket.emit('screen-share:stop', { channelId: connectedVoiceSession.channelId });
    setStatus(`${i18n.screenShare}: ${i18n.inactive}`);
    window.setTimeout(() => {
      screenShareStoppingRef.current = false;
    }, 0);
  }

  function logout() {
    socket?.disconnect();
    microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    stopDisplayStreamTracks(displayStreamRef.current);
    cleanupMixedAudio();
    closeAllPeers();
    activeVoiceChannelIdRef.current = '';
    setConnectedVoiceSession(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setToken('');
    setRefreshToken('');
    setUser(null);
    setWorkspaceMode('servers');
    setServers([]);
    setFriends([]);
    setFriendRequests([]);
    setUserSearchResults([]);
    setConversations([]);
    setSelectedConversationId('');
    setDirectMessages([]);
    setDirectMessageDraft('');
    setChannels([]);
    setMessages([]);
    setServerMembers([]);
    setParticipants([]);
    setMetrics({});
    setSelectedServerId('');
    setSelectedChannelId('');
    setScreenShareEnabled(false);
    setScreenShareLabel('');
    setActiveScreenShares({});
    setPeerDebug({});
    setStatus(i18n.appReady);
  }

  function createDefaultPeerDebug(
    remoteUserId: string,
    pc: RTCPeerConnection | null,
    lastEvent: string,
  ): PeerDebugState {
    return {
      remoteUserId,
      signalingState: pc?.signalingState ?? 'unknown',
      iceConnectionState: pc?.iceConnectionState ?? 'new',
      connectionState: pc?.connectionState ?? 'new',
      localDescriptionType: pc?.localDescription?.type ?? 'none',
      remoteDescriptionType: pc?.remoteDescription?.type ?? 'none',
      localAudioTrack: Boolean(audioStreamRef.current?.getAudioTracks()[0]),
      localVideoTrack: Boolean(displayStreamRef.current?.getVideoTracks()[0]),
      remoteAudioTrack: false,
      remoteVideoTrack: false,
      offersSent: 0,
      answersSent: 0,
      iceSent: 0,
      iceReceived: 0,
      pendingIce: pendingIceRef.current.get(remoteUserId)?.length ?? 0,
      lastEvent,
      updatedAt: new Date().toISOString(),
    };
  }

  function updatePeerDebug(
    remoteUserId: string,
    updater: (current: PeerDebugState) => PeerDebugState,
  ) {
    setPeerDebug((current) => {
      const base =
        current[remoteUserId] ??
        createDefaultPeerDebug(remoteUserId, peerConnectionsRef.current.get(remoteUserId) ?? null, 'debug-init');
      return {
        ...current,
        [remoteUserId]: updater(base),
      };
    });
  }

  function syncPeerConnectionDebug(remoteUserId: string, pc: RTCPeerConnection, lastEvent: string) {
    updatePeerDebug(remoteUserId, (current) => ({
      ...current,
      signalingState: pc.signalingState,
      iceConnectionState: pc.iceConnectionState,
      connectionState: pc.connectionState,
      localDescriptionType: pc.localDescription?.type ?? 'none',
      remoteDescriptionType: pc.remoteDescription?.type ?? 'none',
      localAudioTrack: Boolean(audioStreamRef.current?.getAudioTracks()[0]),
      localVideoTrack: Boolean(displayStreamRef.current?.getVideoTracks()[0]),
      pendingIce: pendingIceRef.current.get(remoteUserId)?.length ?? 0,
      lastEvent,
      updatedAt: new Date().toISOString(),
    }));
  }

  if (!user || !token) {
    return (
      <AuthView
        authMode={authMode}
        authForm={authForm}
        error={error}
        language={language}
        i18n={i18n}
        onAuthModeChange={setAuthMode}
        onAuthFormChange={(updater) => setAuthForm(updater)}
        onSubmit={handleAuthSubmit}
      />
    );
  }

  if (false) {
    return (
      <div className="auth-layout">
        <div className="auth-card">
          <div className="brand-lockup">
            <LogoMark />
            <div className="brand-block">
              <span className="badge">Voistra</span>
              <h1>{i18n.authHeadline}</h1>
              <p>{i18n.authBody}</p>
            </div>
          </div>

          <div className="tabs">
            <button
              className={authMode === 'login' ? 'tab active' : 'tab'}
              type="button"
              onClick={() => setAuthMode('login')}
            >
              {i18n.login}
            </button>
            <button
              className={authMode === 'register' ? 'tab active' : 'tab'}
              type="button"
              onClick={() => setAuthMode('register')}
            >
              {i18n.register}
            </button>
          </div>

          <form className="panel form-grid" onSubmit={handleAuthSubmit}>
            <label>
              {i18n.username}
              <input
                value={authForm.username}
                onChange={(event) => setAuthForm((current) => ({ ...current, username: event.target.value }))}
                placeholder={language === 'ru' ? 'Введите логин' : 'Enter username'}
                required
              />
            </label>

            {authMode === 'register' ? (
              <label>
                {i18n.displayName}
                <input
                  value={authForm.displayName}
                  onChange={(event) =>
                    setAuthForm((current) => ({ ...current, displayName: event.target.value }))
                  }
                  placeholder={language === 'ru' ? 'Как тебя видеть в Voistra' : 'How you appear in Voistra'}
                  required
                />
              </label>
            ) : null}

            <label>
              {i18n.password}
              <input
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={language === 'ru' ? 'Введите пароль' : 'Enter password'}
                required
              />
            </label>

            <button className="primary-button" type="submit">
              {authMode === 'register' ? i18n.createAccount : i18n.signIn}
            </button>
          </form>

          {error ? <div className="error-box">{error}</div> : null}
        </div>
      </div>
    );
  }

  const serverDrawerWidth = serverDirectoryOpen ? 248 : 16;
  const secondarySidebarWidth = workspaceMode === 'servers' ? 288 : 0;
  const effectiveChannelSidebarWidth = showChannelSidebar ? secondarySidebarWidth : 0;
  const shellPaddingLeft = 24 + serverDrawerWidth + (effectiveChannelSidebarWidth > 0 ? effectiveChannelSidebarWidth + 24 : 0);

  return (
    <div className="min-h-screen bg-[#0b0f12] text-slate-100">
      {!serverDirectoryOpen ? (
        <div
          className="fixed inset-y-0 left-0 z-[70] w-6"
          onMouseEnter={() => setServerDirectoryOpen(true)}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className="fixed inset-y-0 left-0 z-[80] overflow-hidden border-r border-white/6 bg-[#0f1417]/95 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl transition-[width] duration-200"
        style={{ width: serverDrawerWidth }}
        onMouseEnter={() => setServerDirectoryOpen(true)}
        onMouseLeave={() => setServerDirectoryOpen(false)}
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
                onClick={() => {
                  setWorkspaceMode('friends');
                  setChannelPanelOpen(false);
                  setAdminPanelOpen(false);
                }}
              >
                {i18n.friendsTab}
              </button>
              <button
                className={workspaceMode === 'profile' ? 'inline-grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500 text-white' : 'inline-grid h-11 w-11 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'}
                type="button"
                onClick={() => {
                  setWorkspaceMode('profile');
                  setChannelPanelOpen(false);
                  setAdminPanelOpen(false);
                }}
                title={i18n.profileTab}
              >
                <ActionIcon kind="settings" />
              </button>
            </div>
            <div className="mt-3 inline-flex rounded-2xl border border-white/6 bg-[#121417] p-1">
              <button
                className={language === 'ru' ? 'rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white' : 'rounded-xl px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:text-white'}
                type="button"
                onClick={() => setLanguage('ru')}
              >
                RU
              </button>
              <button
                className={language === 'en' ? 'rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white' : 'rounded-xl px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:text-white'}
                type="button"
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{i18n.serversTab}</span>
            <button
              className="inline-grid h-9 w-9 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              type="button"
              onClick={() => setServerModalOpen(true)}
              title={i18n.newServer}
            >
              <ActionIcon kind="plus" />
            </button>
          </div>

          <div className="grid gap-3 overflow-y-auto pr-1">
            {servers.map((server) => (
              <button
                key={server.id}
                className={server.id === railActiveServerId
                  ? 'grid gap-1 rounded-[22px] border border-emerald-300/16 bg-emerald-400/12 p-3.5 text-left shadow-[0_18px_36px_rgba(16,185,129,0.12)]'
                  : 'grid gap-1 rounded-[22px] border border-white/6 bg-white/[0.03] p-3.5 text-left transition hover:bg-white/[0.05]'}
                type="button"
                onClick={() => {
                  setWorkspaceMode('servers');
                  setSelectedServerId(server.id);
                  setAdminPanelOpen(false);
                  setChannelPanelOpen(true);
                }}
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
                onClick={() => void handleCopy(selectedServer.id, i18n.serverId)}
              >
                ID: {selectedServer.id}
              </button>
              {canManageServer ? (
                <button
                  className={adminPanelOpen ? 'mt-3 block rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-white' : 'mt-3 block rounded-full border border-white/6 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.06]'}
                  type="button"
                  onClick={() => setAdminPanelOpen((current) => !current)}
                >
                  {language === 'ru' ? 'Управление сервером' : 'Manage server'}
                </button>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="inline-grid h-10 w-10 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.06]"
                type="button"
                onClick={() => setChannelPanelOpen(false)}
                title={language === 'ru' ? 'Скрыть каналы' : 'Hide channels'}
              >
                <ActionIcon kind="menu" />
              </button>
              <button
                className={adminPanelOpen
                  ? 'inline-grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500 text-white'
                  : 'inline-grid h-10 w-10 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.06]'}
                type="button"
                onClick={() => setAdminPanelOpen((current) => !current)}
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
                  className={channel.id === selectedChannelId
                    ? 'grid gap-1 rounded-[20px] border border-emerald-300/16 bg-emerald-400/10 p-3.5 text-left'
                    : 'grid gap-1 rounded-[20px] border border-white/6 bg-white/[0.03] p-3.5 text-left transition hover:bg-white/[0.05]'}
                  type="button"
                  onClick={() => void handleSelectChannel(channel)}
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
                  className={channel.id === selectedChannelId
                    ? 'grid gap-1 rounded-[20px] border border-emerald-300/16 bg-emerald-400/10 p-3.5 text-left'
                    : 'grid gap-1 rounded-[20px] border border-white/6 bg-white/[0.03] p-3.5 text-left transition hover:bg-white/[0.05]'}
                  type="button"
                  onClick={() => void handleSelectChannel(channel)}
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
              <div className="hidden rounded-2xl border border-white/6 bg-[#121417] p-1 sm:inline-flex">
                <button
                  className={language === 'ru' ? 'rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white' : 'rounded-xl px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:text-white'}
                  type="button"
                  onClick={() => setLanguage('ru')}
                >
                  RU
                </button>
                <button
                  className={language === 'en' ? 'rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white' : 'rounded-xl px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:text-white'}
                  type="button"
                  onClick={() => setLanguage('en')}
                >
                  EN
                </button>
              </div>
              <div className="relative">
                <button
                  className={notificationCenterOpen ? 'relative inline-grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500 text-white' : 'relative inline-grid h-11 w-11 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'}
                  type="button"
                  onClick={() => setNotificationCenterOpen((current) => !current)}
                  title={language === 'ru' ? 'Уведомления' : 'Notifications'}
                >
                  <ActionIcon kind="bell" />
                  {notifications.length > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-grid min-h-[20px] min-w-[20px] place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                      {Math.min(notifications.length, 9)}
                    </span>
                  ) : null}
                </button>
                {notificationCenterOpen ? (
                  <div className="absolute right-0 top-14 z-[95] w-[320px] rounded-[24px] border border-white/6 bg-[#151a1d] p-3 shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
                    <div className="mb-2 flex items-center justify-between">
                      <strong className="text-sm text-white">{language === 'ru' ? 'Уведомления' : 'Notifications'}</strong>
                      {notifications.length > 0 ? (
                        <button className="text-xs text-slate-400 hover:text-white" type="button" onClick={() => setNotifications([])}>
                          {language === 'ru' ? 'Очистить' : 'Clear'}
                        </button>
                      ) : null}
                    </div>
                    <div className="grid max-h-[320px] gap-2 overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <div className="rounded-[18px] border border-white/6 bg-white/[0.03] p-3 text-sm text-slate-500">
                          {language === 'ru' ? 'Пока ничего нового.' : 'Nothing new yet.'}
                        </div>
                      ) : notifications.map((notification) => (
                        <div key={notification.id} className="rounded-[18px] border border-white/6 bg-white/[0.03] p-3">
                          <strong className="block text-sm text-white">{notification.title}</strong>
                          <p className="mt-1 text-sm leading-5 text-slate-400">{notification.body}</p>
                          <span className="mt-2 block text-[11px] text-slate-500">{new Date(notification.createdAt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            {workspaceMode === 'servers' ? (
              <>
                <button
                  className={serverDirectoryOpen ? 'inline-grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500 text-white' : 'inline-grid h-11 w-11 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'}
                  type="button"
                  onClick={() => setServerDirectoryOpen((current) => !current)}
                >
                  <ActionIcon kind="panel" />
                </button>
                <button
                  className={showChannelSidebar ? 'inline-grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500 text-white' : 'inline-grid h-11 w-11 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'}
                  type="button"
                  onClick={() => setChannelPanelOpen((current) => !current)}
                >
                  <ActionIcon kind="menu" />
                </button>
                <button
                  className={adminPanelOpen ? 'inline-grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500 text-white' : 'inline-grid h-11 w-11 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'}
                  type="button"
                  onClick={() => setAdminPanelOpen((current) => !current)}
                >
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
            onChange={(event) => void handleAvatarFileChange(event)}
          />

          {workspaceMode === 'friends' ? (
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
              onDirectDraftChange={setDirectMessageDraft}
              onSendDirectMessage={handleSendDirectMessage}
              onSearchUsers={handleSearchUsers}
              onSearchQueryChange={setUserSearchQuery}
              onSendFriendRequest={(userId) => void handleSendFriendRequest(userId)}
              onAcceptFriendRequest={(requestId) => void handleAcceptFriendRequest(requestId)}
              onOpenConversation={(userId) => void handleOpenConversation(userId)}
              onCopy={(value, label) => void handleCopy(value, label)}
              onRemoveFriend={(userId) => void handleRemoveFriend(userId)}
            />
          ) : workspaceMode === 'profile' ? (
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
              onProfilePanelTabChange={setProfilePanelTab}
              onProfileSubmit={handleUpdateProfile}
              onAvatarChoose={() => avatarInputRef.current?.click()}
              onAvatarRemove={() => setProfileForm((current) => ({ ...current, avatarUrl: '' }))}
              onProfileFormChange={(updater) => setProfileForm(updater)}
              onInputDeviceChange={setSelectedInputDeviceId}
              onOutputDeviceChange={setSelectedOutputDeviceId}
              onAudioControlChange={(updater) => setAudioControlForm(updater)}
              onToggleMicrophoneTest={() => void toggleMicrophoneTest()}
              onAudioEnhancementModeChange={applyAudioEnhancementMode}
              renderAudioProcessing={
                <div className="space-y-3">
                  <ToggleRow label={i18n.voiceActivation} checked={profileForm.voiceActivationEnabled} onChange={(checked) => setProfileForm((current) => ({ ...current, voiceActivationEnabled: checked }))} />
                  <ToggleRow label={i18n.noiseSuppression} checked={profileForm.noiseSuppressionEnabled} onChange={(checked) => setProfileForm((current) => ({ ...current, noiseSuppressionEnabled: checked }))} />
                  <ToggleRow label={i18n.echoCancellation} checked={profileForm.echoCancellationEnabled} onChange={(checked) => setProfileForm((current) => ({ ...current, echoCancellationEnabled: checked }))} />
                  <ToggleRow label={i18n.autoGainControl} checked={profileForm.autoGainControlEnabled} onChange={(checked) => setProfileForm((current) => ({ ...current, autoGainControlEnabled: checked }))} />
                </div>
              }
            />
          ) : selectedChannel?.type === 'text' ? (
            <TextChannelView
              i18n={i18n}
              messages={messages}
              messageDraft={messageDraft}
              onMessageDraftChange={setMessageDraft}
              onSendMessage={handleSendMessage}
              renderSidePanel={adminPanelOpen ? (
                <aside className="rounded-[28px] border border-white/6 bg-[#171a1d] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.22)]">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{i18n.serverOverview}</h3>
                      <p className="text-sm text-slate-500">{roleLabel(selectedServer?.currentUserRole)}</p>
                    </div>
                  </div>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <button className={serverPanelTab === 'overview' ? 'rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white' : 'rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-300'} type="button" onClick={() => setServerPanelTab('overview')}>{i18n.overviewTab}</button>
                    <button className={serverPanelTab === 'members' ? 'rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white' : 'rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-300'} type="button" onClick={() => setServerPanelTab('members')}>{i18n.membersTab}</button>
                    <button className={serverPanelTab === 'settings' ? 'rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white' : 'rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-300'} type="button" onClick={() => setServerPanelTab('settings')}>{i18n.settingsTab}</button>
                  </div>
                  {serverPanelTab === 'overview' ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-3xl border border-white/6 bg-white/[0.03] p-4"><span className="block text-xs text-slate-500">{i18n.owner}</span><strong className="mt-2 block text-white">{selectedServer?.owner?.displayName ?? i18n.unknownUser}</strong></div>
                      <div className="rounded-3xl border border-white/6 bg-white/[0.03] p-4"><span className="block text-xs text-slate-500">{i18n.members}</span><strong className="mt-2 block text-white">{selectedServer?.memberCount ?? 0}</strong></div>
                    </div>
                  ) : null}
                  {serverPanelTab === 'members' ? (
                    <div className="grid gap-3">
                      {serverMembers.map((member) => (
                        <div key={member.id} className="rounded-3xl border border-white/6 bg-white/[0.03] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <UserIdentity displayName={member.user?.displayName ?? member.user?.username ?? member.userId} username={member.user?.username ?? i18n.unknownUser} subtitle={`@${member.user?.username ?? i18n.unknownUser}`} compact />
                            <button className="inline-grid h-10 w-10 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300" type="button" onClick={() => setSelectedMemberActionUserId((current) => current === member.userId ? '' : member.userId)}>
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
                              <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-left text-sm text-slate-200" type="button" onClick={() => void handleCopy(member.userId, i18n.copyId)}>{i18n.copyId}</button>
                              {member.userId !== user.id ? <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-left text-sm text-slate-200" type="button" onClick={() => void handleOpenConversation(member.userId)}>{i18n.openDialog}</button> : null}
                              {canManageServer && !member.isOwner && member.userId !== user.id ? (
                                <>
                                  <div className="grid gap-2 sm:grid-cols-2">
                                    <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-left text-sm text-slate-200" type="button" onClick={() => void handleModerateMember(member.userId, 'mute', 10)}>{language === 'ru' ? 'Микрофон 10м' : 'Mute 10m'}</button>
                                    <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-left text-sm text-slate-200" type="button" onClick={() => void handleModerateMember(member.userId, 'deafen', 10)}>{language === 'ru' ? 'Звук 10м' : 'Deafen 10m'}</button>
                                    <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-left text-sm text-slate-200" type="button" onClick={() => void handleModerateMember(member.userId, 'block_share', 30)}>{language === 'ru' ? 'Запретить показ 30м' : 'Block share 30m'}</button>
                                    <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-left text-sm text-slate-200" type="button" onClick={() => void handleModerateMember(member.userId, 'ban', 60)}>{language === 'ru' ? 'Бан 1ч' : 'Ban 1h'}</button>
                                  </div>
                                    {member.moderation && (member.moderation.isMuted || member.moderation.isDeafened || member.moderation.isScreenShareBlocked || member.moderation.isBanned) ? (
                                      <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-left text-sm text-slate-200" type="button" onClick={() => void handleClearMemberRestrictions(member.userId)}>{language === 'ru' ? 'Снять ограничения' : 'Clear restrictions'}</button>
                                    ) : null}
                                </>
                              ) : null}
                              {canManageServer && !member.isOwner && member.userId !== user.id ? <button className="rounded-2xl border border-red-400/16 bg-red-500/10 px-4 py-2 text-left text-sm font-medium text-red-200" type="button" onClick={() => handleRemoveMember(member.userId)}>{language === 'ru' ? 'Удалить с сервера' : 'Remove from server'}</button> : null}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {serverPanelTab === 'settings' && canManageServer && selectedServer ? (
                    <div className="grid gap-4">
                      {canCreateChannel ? (
                        <form className="grid gap-3 rounded-3xl border border-white/6 bg-white/[0.03] p-4" onSubmit={handleCreateChannel}>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h4 className="text-sm font-semibold text-white">{i18n.createChannel}</h4>
                              <p className="text-xs text-slate-500">{i18n.text} / {i18n.voice}</p>
                            </div>
                          </div>
                          <input
                            className="h-11 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none"
                            value={createChannelForm.name}
                            onChange={(event) => setCreateChannelForm((current) => ({ ...current, name: event.target.value }))}
                            placeholder={i18n.general}
                            required
                          />
                          <select
                            className="h-11 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none"
                            value={createChannelForm.type}
                            onChange={(event) =>
                              setCreateChannelForm((current) => ({
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
                                setCreateChannelForm((current) => ({
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
                              onChange={(event) => setCreateChannelForm((current) => ({ ...current, password: event.target.value }))}
                              placeholder={i18n.channelPassword}
                            />
                          ) : null}
                          <button className="h-11 rounded-2xl bg-emerald-500 px-4 text-sm font-semibold text-white" type="submit" disabled={!selectedServerId || !canCreateChannel}>
                            {i18n.createChannel}
                          </button>
                        </form>
                      ) : null}

                      <form className="grid gap-3 rounded-3xl border border-white/6 bg-white/[0.03] p-4" onSubmit={handleUpdateServer}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-semibold text-white">{i18n.serverSettings}</h4>
                            <p className="text-xs text-slate-500">ID: {selectedServer.id}</p>
                          </div>
                        </div>
                        <input className="h-11 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none" value={serverSettingsForm.name} onChange={(event) => setServerSettingsForm((current) => ({ ...current, name: event.target.value }))} placeholder={i18n.updateServerName} />
                        <input className="h-11 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none" value={serverSettingsForm.description} onChange={(event) => setServerSettingsForm((current) => ({ ...current, description: event.target.value }))} placeholder={i18n.updateDescription} />
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
                                    setChannelSettingsDrafts((current) => ({
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
                                      setChannelSettingsDrafts((current) => ({
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
                                      setChannelSettingsDrafts((current) => ({
                                        ...current,
                                        [channel.id]: { ...draft, password: event.target.value },
                                      }))
                                    }
                                    placeholder={i18n.channelPassword}
                                  />
                                ) : null}
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <button className="h-11 rounded-2xl border border-white/6 bg-white/[0.03] px-4 text-sm font-medium text-slate-200" type="button" onClick={() => void handleUpdateChannel(channel.id)}>
                                    {language === 'ru' ? 'Обновить канал' : 'Update channel'}
                                  </button>
                                  <button className="h-11 rounded-2xl border border-red-400/16 bg-red-500/10 px-4 text-sm font-medium text-red-200" type="button" onClick={() => void handleRemoveSpecificChannel(channel.id)}>
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
              ) : null}
            />
          ) : selectedChannel?.type === 'voice' ? (
            <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="rounded-[28px] border border-white/6 bg-[#171a1d] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.22)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{i18n.voiceControl}</h3>
                    <p className="text-sm text-slate-500">{participants.length} {i18n.people}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white" type="button" onClick={joinVoiceChannel}>{i18n.joinVoice}</button>
                    <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-200" type="button" onClick={leaveVoiceChannel}>{i18n.leaveVoice}</button>
                  </div>
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <button className={voiceFlags.muted ? 'inline-grid h-11 w-11 place-items-center rounded-2xl bg-red-500/20 text-red-100' : 'inline-grid h-11 w-11 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300'} type="button" onClick={() => emitVoiceState({ muted: !voiceFlags.muted })}><ActionIcon kind="mute" /></button>
                  <button className={voiceFlags.deafened ? 'inline-grid h-11 w-11 place-items-center rounded-2xl bg-red-500/20 text-red-100' : 'inline-grid h-11 w-11 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300'} type="button" onClick={() => emitVoiceState({ deafened: !voiceFlags.deafened })}><ActionIcon kind="ear" /></button>
                  <button className={screenShareEnabled ? 'inline-grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500 text-white' : 'inline-grid h-11 w-11 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300'} type="button" onClick={() => (screenShareEnabled ? stopScreenShare() : void startScreenShare())}><ActionIcon kind="screen" /></button>
                </div>
                <div className="grid gap-3 xl:grid-cols-2">
                  {participants.map((participant) => {
                    const isSelf = participant.userId === user.id;
                    return (
                    <div key={participant.userId} className={isSelf ? 'rounded-[24px] border border-emerald-300/16 bg-emerald-400/[0.08] p-4' : 'rounded-[24px] border border-white/6 bg-white/[0.03] p-4'}>
                      <div className="flex items-center justify-between gap-3">
                        <UserIdentity
                          displayName={isSelf ? user.displayName : participant.username}
                          username={participant.username}
                          avatarUrl={isSelf ? shellUser?.avatarUrl : undefined}
                          subtitle={isSelf ? (language === 'ru' ? 'Это вы' : 'You') : `@${participant.username}`}
                          compact
                        />
                        <div className="flex items-center gap-2">
                          <span className={participant.speaking || participant.pushToTalkActive ? 'inline-flex h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.12)]' : 'inline-flex h-3 w-3 rounded-full bg-slate-600'} />
                          {participant.muted ? <span className="inline-grid h-8 w-8 place-items-center rounded-xl bg-red-500/14 text-red-200"><ActionIcon kind="mute" /></span> : null}
                          {participant.deafened ? <span className="inline-grid h-8 w-8 place-items-center rounded-xl bg-white/[0.05] text-slate-300"><ActionIcon kind="ear" /></span> : null}
                          {activeScreenShares[participant.userId] ? <span className="rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">{i18n.live}</span> : null}
                        </div>
                      </div>
                      {isSelf ? (
                        <div className="mt-3 rounded-2xl border border-white/6 bg-black/10 px-3 py-2 text-xs font-medium text-slate-400">
                          {language === 'ru' ? 'Твоя громкость управляется только у других участников.' : 'Others control how loud you are on their side.'}
                        </div>
                      ) : (
                        <label className="mt-3 grid gap-2 text-xs font-medium text-slate-400">
                          <span>{i18n.participantVolume}</span>
                          <input type="range" min="0" max="100" value={remoteParticipantVolumes[participant.userId] ?? 100} onChange={(event) => setRemoteParticipantVolumes((current) => ({ ...current, [participant.userId]: Number(event.target.value) }))} />
                        </label>
                      )}
                    </div>
                  )})}
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {Object.entries(remoteMedia).map(([remoteUserId, media]) => (
                    <RemoteMediaView
                      key={remoteUserId}
                      label={participants.find((participant) => participant.userId === remoteUserId)?.username ?? remoteUserId}
                      audioStream={media.audioStream}
                      screenStream={activeScreenShares[remoteUserId] ? media.screenStream : undefined}
                      muted={voiceFlags.deafened}
                      volume={clampMediaVolume(((remoteParticipantVolumes[remoteUserId] ?? 100) / 100) * (audioControlForm.outputLevel / 100))}
                      shareLevel={remoteShareVolumes[remoteUserId] ?? 100}
                      shareVolume={clampMediaVolume(((remoteShareVolumes[remoteUserId] ?? 100) / 100) * (audioControlForm.outputLevel / 100))}
                      outputDeviceId={selectedOutputDeviceId}
                      language={language}
                      onShareVolumeChange={(value) => setRemoteShareVolumes((current) => ({ ...current, [remoteUserId]: value }))}
                    />
                  ))}
                </div>
              </div>

              <aside className="space-y-4 rounded-[28px] border border-white/6 bg-[#171a1d] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.22)]">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">{i18n.screenShare}</h3>
                  <span className="text-sm text-slate-500">{screenShareEnabled ? i18n.live : i18n.inactive}</span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white" type="button" onClick={() => void startScreenShare()}>{i18n.startShare}</button>
                  <button className="flex-1 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-200" type="button" onClick={stopScreenShare}>{i18n.stopShare}</button>
                </div>
                <ToggleRow label={i18n.allowStreamAudio} checked={shareSystemAudioEnabled} onChange={setShareSystemAudioEnabled} />
                <div className="overflow-hidden rounded-[24px] border border-white/6 bg-[#101214] p-2">
                  <video ref={previewVideoRef} autoPlay muted playsInline className="w-full rounded-[18px]" />
                </div>
                {adminPanelOpen && selectedServer ? (
                  <div className="grid gap-3 rounded-[24px] border border-white/6 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-white">{i18n.serverOverview}</h4>
                        <p className="text-xs text-slate-500">{roleLabel(selectedServer.currentUserRole)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button className={serverPanelTab === 'overview' ? 'rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white' : 'rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-300'} type="button" onClick={() => setServerPanelTab('overview')}>{i18n.overviewTab}</button>
                      <button className={serverPanelTab === 'members' ? 'rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white' : 'rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-300'} type="button" onClick={() => setServerPanelTab('members')}>{i18n.membersTab}</button>
                      <button className={serverPanelTab === 'settings' ? 'rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white' : 'rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-300'} type="button" onClick={() => setServerPanelTab('settings')}>{i18n.settingsTab}</button>
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
                              <button className="inline-grid h-9 w-9 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300" type="button" onClick={() => setSelectedMemberActionUserId((current) => current === member.userId ? '' : member.userId)}>
                                <ActionIcon kind="more" />
                              </button>
                            </div>
                            {selectedMemberActionUserId === member.userId ? (
                              <div className="mt-3 grid gap-2">
                                <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-left text-sm text-slate-200" type="button" onClick={() => void handleCopy(member.userId, i18n.copyId)}>{i18n.copyId}</button>
                                {member.userId !== user.id ? <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-left text-sm text-slate-200" type="button" onClick={() => void handleOpenConversation(member.userId)}>{i18n.openDialog}</button> : null}
                                {canManageServer && !member.isOwner && member.userId !== user.id ? <button className="rounded-2xl border border-red-400/16 bg-red-500/10 px-3 py-2 text-left text-sm font-medium text-red-200" type="button" onClick={() => handleRemoveMember(member.userId)}>{language === 'ru' ? 'Удалить с сервера' : 'Remove from server'}</button> : null}
                              </div>
                            ) : null}
                          </div>
                        ))}
                        {selectedManagedMember && canManageServer && !selectedManagedMember.isOwner && selectedManagedMember.userId !== user.id ? (
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
                              <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-left text-sm text-slate-200" type="button" onClick={() => void handleModerateMember(selectedManagedMember.userId, 'mute', 10)}>{language === 'ru' ? 'Микрофон 10м' : 'Mute 10m'}</button>
                              <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-left text-sm text-slate-200" type="button" onClick={() => void handleModerateMember(selectedManagedMember.userId, 'deafen', 10)}>{language === 'ru' ? 'Звук 10м' : 'Deafen 10m'}</button>
                              <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-left text-sm text-slate-200" type="button" onClick={() => void handleModerateMember(selectedManagedMember.userId, 'block_share', 30)}>{language === 'ru' ? 'Запретить показ 30м' : 'Block share 30m'}</button>
                              <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-left text-sm text-slate-200" type="button" onClick={() => void handleModerateMember(selectedManagedMember.userId, 'ban', 60)}>{language === 'ru' ? 'Бан 1ч' : 'Ban 1h'}</button>
                            </div>
                            {(selectedManagedMember.moderation?.isMuted || selectedManagedMember.moderation?.isDeafened || selectedManagedMember.moderation?.isScreenShareBlocked || selectedManagedMember.moderation?.isBanned) ? (
                              <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-left text-sm text-slate-200" type="button" onClick={() => void handleClearMemberRestrictions(selectedManagedMember.userId)}>{language === 'ru' ? 'Снять ограничения' : 'Clear restrictions'}</button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {serverPanelTab === 'settings' && canManageServer ? (
                      <div className="grid gap-3">
                        {canCreateChannel ? (
                          <form className="grid gap-3 rounded-3xl border border-white/6 bg-[#121417] p-3" onSubmit={handleCreateChannel}>
                            <h5 className="text-sm font-semibold text-white">{i18n.createChannel}</h5>
                            <input className="h-10 rounded-2xl border border-white/6 bg-black/10 px-3 text-sm text-slate-100 outline-none" value={createChannelForm.name} onChange={(event) => setCreateChannelForm((current) => ({ ...current, name: event.target.value }))} placeholder={i18n.general} required />
                            <select className="h-10 rounded-2xl border border-white/6 bg-black/10 px-3 text-sm text-slate-100 outline-none" value={createChannelForm.type} onChange={(event) => setCreateChannelForm((current) => ({ ...current, type: event.target.value as 'text' | 'voice' }))}>
                              <option value="text">{i18n.text}</option>
                              <option value="voice">{i18n.voice}</option>
                            </select>
                            <label className="flex items-center gap-3 rounded-2xl border border-white/6 bg-black/10 px-3 py-2 text-sm text-slate-300">
                              <input type="checkbox" checked={createChannelForm.isPrivate} onChange={(event) => setCreateChannelForm((current) => ({ ...current, isPrivate: event.target.checked, password: event.target.checked ? current.password : '' }))} />
                              {i18n.privateChannel}
                            </label>
                            {createChannelForm.isPrivate ? <input className="h-10 rounded-2xl border border-white/6 bg-black/10 px-3 text-sm text-slate-100 outline-none" type="password" value={createChannelForm.password} onChange={(event) => setCreateChannelForm((current) => ({ ...current, password: event.target.value }))} placeholder={i18n.channelPassword} /> : null}
                            <button className="h-10 rounded-2xl bg-emerald-500 px-3 text-sm font-semibold text-white" type="submit">{i18n.createChannel}</button>
                          </form>
                        ) : null}
                        <form className="grid gap-3 rounded-3xl border border-white/6 bg-[#121417] p-3" onSubmit={handleUpdateServer}>
                          <h5 className="text-sm font-semibold text-white">{i18n.serverSettings}</h5>
                          <input className="h-10 rounded-2xl border border-white/6 bg-black/10 px-3 text-sm text-slate-100 outline-none" value={serverSettingsForm.name} onChange={(event) => setServerSettingsForm((current) => ({ ...current, name: event.target.value }))} placeholder={i18n.updateServerName} />
                          <input className="h-10 rounded-2xl border border-white/6 bg-black/10 px-3 text-sm text-slate-100 outline-none" value={serverSettingsForm.description} onChange={(event) => setServerSettingsForm((current) => ({ ...current, description: event.target.value }))} placeholder={i18n.updateDescription} />
                          <button className="h-10 rounded-2xl bg-emerald-500 px-3 text-sm font-semibold text-white" type="submit">{i18n.saveServer}</button>
                        </form>
                        <div className="grid gap-3 rounded-3xl border border-white/6 bg-[#121417] p-3">
                          <h5 className="text-sm font-semibold text-white">{i18n.channels}</h5>
                          {channels.map((channel) => {
                            const draft = channelSettingsDrafts[channel.id] ?? {
                              name: channel.name,
                              isPrivate: channel.isPrivate,
                              password: '',
                            };

                            return (
                              <div key={`voice-channel-${channel.id}`} className="grid gap-3 rounded-3xl border border-white/6 bg-black/10 p-3">
                                <input className="h-10 rounded-2xl border border-white/6 bg-black/10 px-3 text-sm text-slate-100 outline-none" value={draft.name} onChange={(event) => setChannelSettingsDrafts((current) => ({ ...current, [channel.id]: { ...draft, name: event.target.value } }))} />
                                <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                                  <span>{channel.type === 'text' ? i18n.text : i18n.voice}</span>
                                  <span>ID: {channel.id}</span>
                                </div>
                                <label className="flex items-center gap-3 rounded-2xl border border-white/6 bg-black/10 px-3 py-2 text-sm text-slate-300">
                                  <input type="checkbox" checked={draft.isPrivate} onChange={(event) => setChannelSettingsDrafts((current) => ({ ...current, [channel.id]: { ...draft, isPrivate: event.target.checked, password: event.target.checked ? draft.password : '' } }))} />
                                  {i18n.privateChannel}
                                </label>
                                {draft.isPrivate ? <input className="h-10 rounded-2xl border border-white/6 bg-black/10 px-3 text-sm text-slate-100 outline-none" type="password" value={draft.password} onChange={(event) => setChannelSettingsDrafts((current) => ({ ...current, [channel.id]: { ...draft, password: event.target.value } }))} placeholder={i18n.channelPassword} /> : null}
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <button className="h-10 rounded-2xl border border-white/6 bg-white/[0.03] px-3 text-sm font-medium text-slate-200" type="button" onClick={() => void handleUpdateChannel(channel.id)}>{language === 'ru' ? 'Обновить канал' : 'Update channel'}</button>
                                  <button className="h-10 rounded-2xl border border-red-400/16 bg-red-500/10 px-3 text-sm font-medium text-red-200" type="button" onClick={() => void handleRemoveSpecificChannel(channel.id)}>{language === 'ru' ? 'Удалить канал' : 'Delete channel'}</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </aside>
            </section>
          ) : selectedServer ? (
            <section className="rounded-[28px] border border-white/6 bg-[#171a1d] p-6 shadow-[0_20px_48px_rgba(0,0,0,0.22)]">
              <h3 className="text-2xl font-semibold text-white">{selectedServer.name}</h3>
              <p className="mt-2 text-sm text-slate-500">{selectedServer.description || i18n.noDescription}</p>
            </section>
          ) : (
            <section className="rounded-[28px] border border-white/6 bg-[#171a1d] p-6 shadow-[0_20px_48px_rgba(0,0,0,0.22)]">
              <h3 className="text-2xl font-semibold text-white">{i18n.selectChannelBegin}</h3>
              <p className="mt-2 text-sm text-slate-500">{i18n.selectChannelHelp}</p>
            </section>
          )}

          {error ? <div className="rounded-2xl border border-red-400/16 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">{error}</div> : null}
        </div>
      </div>

      {toast ? <div className="fixed bottom-6 right-6 z-[90] rounded-2xl border border-emerald-300/14 bg-[#151c1c] px-4 py-3 text-sm font-semibold text-emerald-50 shadow-[0_20px_48px_rgba(0,0,0,0.36)]">{toast}</div> : null}

      {pendingLockedChannel ? (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-black/55 p-6" role="presentation" onClick={() => setChannelAccessForm({ channelId: '', password: '' })}>
          <form
            className="grid w-full max-w-md gap-4 rounded-[28px] border border-white/6 bg-[#151a1d] p-6 shadow-[0_32px_100px_rgba(0,0,0,0.46)]"
            role="dialog"
            aria-modal="true"
            onSubmit={(event) => void handleUnlockChannel(event)}
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <span className="inline-flex rounded-full bg-red-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-100">{i18n.lockedChannel}</span>
              <h3 className="mt-4 text-xl font-semibold text-white">{pendingLockedChannel.name}</h3>
              <p className="mt-2 text-sm text-slate-500">{language === 'ru' ? 'Введи пароль один раз. Повторный ввод понадобится только после смены пароля.' : 'Enter the password once. You will only need it again after the password changes.'}</p>
            </div>
            <input
              className="h-12 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/10"
              type="password"
              value={channelAccessForm.password}
              onChange={(event) => setChannelAccessForm((current) => ({ ...current, password: event.target.value }))}
              placeholder={i18n.channelPassword}
              autoFocus
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <button className="h-11 rounded-2xl bg-emerald-500 px-4 text-sm font-semibold text-white" type="submit">
                {i18n.unlockChannel}
              </button>
              <button className="h-11 rounded-2xl border border-white/6 bg-white/[0.03] px-4 text-sm font-medium text-slate-200" type="button" onClick={() => setChannelAccessForm({ channelId: '', password: '' })}>
                {i18n.cancel}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {serverModalOpen ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-6" role="presentation" onClick={() => setServerModalOpen(false)}>
          <div className="grid w-full max-w-4xl gap-4 rounded-[32px] border border-white/6 bg-[#151a1d] p-6 shadow-[0_32px_100px_rgba(0,0,0,0.46)] xl:grid-cols-2" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <form className="grid gap-3 rounded-[24px] border border-white/6 bg-white/[0.03] p-5" onSubmit={async (event) => { await handleCreateServer(event); setServerModalOpen(false); }}>
              <div>
                <h3 className="text-lg font-semibold text-white">{i18n.createServer}</h3>
              </div>
              <input className="h-12 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none" value={createServerForm.name} onChange={(event) => setCreateServerForm((current) => ({ ...current, name: event.target.value }))} placeholder={i18n.serverDraftName} required />
              <input className="h-12 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none" value={createServerForm.description} onChange={(event) => setCreateServerForm((current) => ({ ...current, description: event.target.value }))} placeholder={i18n.serverDraftDescription} />
              <button className="h-12 rounded-2xl bg-emerald-500 px-5 text-sm font-semibold text-white" type="submit">{i18n.createServer}</button>
            </form>
            <form className="grid gap-3 rounded-[24px] border border-white/6 bg-white/[0.03] p-5" onSubmit={async (event) => { await handleJoinServer(event); setServerModalOpen(false); }}>
              <div>
                <h3 className="text-lg font-semibold text-white">{i18n.joinServer}</h3>
              </div>
              <input className="h-12 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none" value={joinServerForm.serverId} onChange={(event) => setJoinServerForm((current) => ({ ...current, serverId: event.target.value }))} placeholder={i18n.pasteServerId} required />
              <button className="h-12 rounded-2xl border border-white/6 bg-white/[0.03] px-5 text-sm font-semibold text-slate-100" type="submit">{i18n.joinServer}</button>
            </form>
          </div>
        </div>
      ) : null}

      {avatarEditor ? (
        <div className="fixed inset-0 z-[105] grid place-items-center bg-black/65 p-6" role="presentation" onClick={() => setAvatarEditor(null)}>
          <div className="grid w-full max-w-2xl gap-5 rounded-[32px] border border-white/6 bg-[#151a1d] p-6 shadow-[0_32px_100px_rgba(0,0,0,0.46)]" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div>
              <span className="inline-flex rounded-full bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{language === 'ru' ? 'Редактор фото' : 'Avatar editor'}</span>
              <h3 className="mt-4 text-xl font-semibold text-white">{language === 'ru' ? 'Настрой отображение фото' : 'Adjust your avatar framing'}</h3>
            </div>
            <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
              <div className="mx-auto flex h-[280px] w-[280px] items-center justify-center overflow-hidden rounded-full border border-white/6 bg-[#101214] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
                <img
                  src={avatarEditor.source}
                  alt="avatar preview"
                  className="max-w-none"
                  style={{
                    transform: `translate(${avatarEditor.offsetX}px, ${avatarEditor.offsetY}px) scale(${avatarEditor.scale})`,
                  }}
                />
              </div>
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-medium text-slate-200">
                  <span>{language === 'ru' ? 'Масштаб' : 'Zoom'}</span>
                  <input type="range" min="1" max="2.4" step="0.05" value={avatarEditor.scale} onChange={(event) => setAvatarEditor((current) => current ? { ...current, scale: Number(event.target.value) } : current)} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-200">
                  <span>{language === 'ru' ? 'Смещение по горизонтали' : 'Horizontal offset'}</span>
                  <input type="range" min="-120" max="120" step="1" value={avatarEditor.offsetX} onChange={(event) => setAvatarEditor((current) => current ? { ...current, offsetX: Number(event.target.value) } : current)} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-200">
                  <span>{language === 'ru' ? 'Смещение по вертикали' : 'Vertical offset'}</span>
                  <input type="range" min="-120" max="120" step="1" value={avatarEditor.offsetY} onChange={(event) => setAvatarEditor((current) => current ? { ...current, offsetY: Number(event.target.value) } : current)} />
                </label>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button className="h-11 rounded-2xl border border-white/6 bg-white/[0.03] px-4 text-sm font-medium text-slate-200" type="button" onClick={() => setAvatarEditor(null)}>
                {language === 'ru' ? 'Отмена' : 'Cancel'}
              </button>
              <button className="h-11 rounded-2xl bg-emerald-500 px-4 text-sm font-semibold text-white" type="button" onClick={applyAvatarEditor}>
                {language === 'ru' ? 'Применить фото' : 'Apply image'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      className={[
        'app-shell',
        workspaceMode === 'servers' && selectedServer ? 'app-shell-server-focus' : '',
        !serverDirectoryOpen ? 'app-shell-server-directory-collapsed' : '',
        !showChannelSidebar ? 'app-shell-channel-collapsed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {!serverDirectoryOpen ? (
        <div
          className="server-rail-hotspot"
          onMouseEnter={() => setServerDirectoryOpen(true)}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={serverDirectoryOpen ? 'sidebar sidebar-servers' : 'sidebar sidebar-servers sidebar-collapsed'}
        onMouseEnter={() => setServerDirectoryOpen(true)}
        onMouseLeave={() => setServerDirectoryOpen(false)}
      >
        <div className="server-rail panel">
          <button
            className={workspaceMode === 'friends' ? 'server-rail-button active' : 'server-rail-button'}
            type="button"
            onClick={() => setWorkspaceMode('friends')}
            title={i18n.friendsTab}
          >
            DM
          </button>
          {servers.map((server) => (
            <button
              key={`rail-${server.id}`}
              className={server.id === railActiveServerId ? 'server-rail-button active' : 'server-rail-button'}
              type="button"
              onClick={() => {
                setWorkspaceMode('servers');
                setSelectedServerId(server.id);
                setAdminPanelOpen(false);
                setServerDirectoryOpen(false);
                setChannelPanelOpen(true);
              }}
              title={server.name}
            >
              {server.name.slice(0, 2).toUpperCase()}
            </button>
          ))}
          <button className="server-rail-button" type="button" onClick={() => setServerModalOpen(true)} title={i18n.newServer}>
            +
          </button>
          <button
            className={workspaceMode === 'profile' ? 'server-rail-button active' : 'server-rail-button'}
            type="button"
            onClick={() => setWorkspaceMode('profile')}
            title={i18n.profileTab}
          >
            {user!.displayName.slice(0, 1).toUpperCase()}
          </button>
        </div>

        <div className="panel profile-dock">
          <button className="profile-dock-main" type="button" onClick={() => setWorkspaceMode('profile')}>
            <ProfileAvatar user={user} />
            <div className="profile-dock-meta">
              <strong>{user!.displayName}</strong>
              <span>@{user!.username}</span>
            </div>
          </button>
          <div className="profile-dock-actions">
            <button
              className={voiceFlags.muted ? 'danger-button icon-compact' : 'ghost-button icon-compact'}
              type="button"
              onClick={() => emitVoiceState({ muted: !voiceFlags.muted })}
              title={voiceFlags.muted ? i18n.unmute : i18n.mute}
            >
              <ActionIcon kind="mute" />
            </button>
            <button
              className={voiceFlags.deafened ? 'danger-button icon-compact' : 'ghost-button icon-compact'}
              type="button"
              onClick={() => emitVoiceState({ deafened: !voiceFlags.deafened })}
              title={voiceFlags.deafened ? i18n.undeafen : i18n.deafen}
            >
              <ActionIcon kind="ear" />
            </button>
            <button className="ghost-button icon-compact" type="button" onClick={() => setWorkspaceMode('profile')} title={i18n.profileTab}>
              <ActionIcon kind="settings" />
            </button>
            <button className="ghost-button icon-compact" type="button" onClick={logout} title={i18n.logOut}>
              <ActionIcon kind="logout" />
            </button>
          </div>
        </div>

        <button
          className={workspaceMode === 'friends' ? 'list-item nav-list-item active' : 'list-item nav-list-item'}
          type="button"
          onClick={() => {
            setWorkspaceMode('friends');
            setChannelPanelOpen(true);
          }}
        >
          <strong>{i18n.friendsTab}</strong>
          <span>{conversations.length} {i18n.messages}</span>
        </button>

        <div className="subsection-heading sidebar-subsection-heading">
          <strong>{language === 'ru' ? 'Серверы' : 'Servers'}</strong>
          <button className="ghost-button icon-compact" type="button" onClick={() => setServerModalOpen(true)} title={i18n.newServer}>
            <ActionIcon kind="plus" />
          </button>
        </div>

        <div className="list-block server-browser-list">
          {servers.map((server) => (
            <button
              key={server.id}
              className={server.id === railActiveServerId ? 'list-item server-browser-item active' : 'list-item server-browser-item'}
              type="button"
              onClick={() => {
                setWorkspaceMode('servers');
                setSelectedServerId(server.id);
                setAdminPanelOpen(false);
                setServerDirectoryOpen(false);
                setChannelPanelOpen(true);
              }}
            >
              <span className="server-browser-icon">{server.name.slice(0, 2).toUpperCase()}</span>
              <div className="server-browser-meta">
                <strong>{server.name}</strong>
                <span>{server.memberCount} {i18n.members}</span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <aside className={showChannelSidebar ? 'sidebar sidebar-channels' : 'sidebar sidebar-channels sidebar-collapsed'}>
        {workspaceMode === 'servers' ? (
          <>
        <div className="sidebar-header">
          <div className="server-sidebar-heading">
            <span className="badge">{selectedServer ? i18n.serverName : i18n.channels}</span>
            <h2>{selectedServer?.name ?? i18n.joinServer}</h2>
            {selectedServer ? (
              <button className="server-id-chip server-id-chip-inline" type="button" onClick={() => void handleCopy(selectedServer!.id, i18n.serverId)}>
                ID: {selectedServer!.id}
              </button>
            ) : null}
          </div>
          {selectedServer ? (
            <button
              className="ghost-button icon-compact"
              type="button"
              onClick={() => setServerDirectoryOpen((current) => !current)}
              title={language === 'ru' ? 'Все серверы' : 'All servers'}
            >
              <ActionIcon kind="panel" />
            </button>
          ) : null}
        </div>

        <div className="list-block channel-groups">
          <div className="channel-group">
            <div className="group-heading">
              <strong>{i18n.textChannels}</strong>
              <span>{textChannels.length}</span>
            </div>
            {textChannels.map((channel) => (
              <button
                key={channel.id}
                className={channel.id === selectedChannelId ? 'list-item active' : 'list-item'}
                type="button"
                onClick={() => void handleSelectChannel(channel)}
              >
                <strong>
                  <ChannelGlyph type={channel.type} /> {channel.name}
                </strong>
                <div className="server-meta">
                  <AccessBadge isPrivate={channel.isPrivate} language={language} />
                </div>
              </button>
            ))}
          </div>

          <div className="channel-group">
            <div className="group-heading">
              <strong>{i18n.voiceChannels}</strong>
              <span>{voiceChannels.length}</span>
            </div>
            {voiceChannels.map((channel) => (
              <button
                key={channel.id}
                className={channel.id === selectedChannelId ? 'list-item active' : 'list-item'}
                type="button"
                onClick={() => void handleSelectChannel(channel)}
              >
                <strong>
                  <ChannelGlyph type={channel.type} /> {channel.name}
                </strong>
                <div className="server-meta">
                  <AccessBadge isPrivate={channel.isPrivate} language={language} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {pendingLockedChannel ? (
          <form className="panel form-grid compact" onSubmit={handleUnlockChannel}>
            <div className="panel-heading">
              <strong>{pendingLockedChannel!.name}</strong>
              <span>{i18n.lockedChannel}</span>
            </div>
            <label>
              {i18n.channelPassword}
              <input
                type="password"
                value={channelAccessForm.password}
                onChange={(event) =>
                  setChannelAccessForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder={i18n.channelPassword}
              />
            </label>
            <div className="inline-actions">
              <button className="primary-button" type="submit">
                {i18n.unlockChannel}
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={() => setChannelAccessForm({ channelId: '', password: '' })}
              >
                {i18n.cancel}
              </button>
            </div>
          </form>
        ) : null}

        <div className="list-block legacy-channel-list">
          {channels.map((channel) => (
            <button
              key={channel.id}
              className={channel.id === selectedChannelId ? 'list-item active' : 'list-item'}
              type="button"
              onClick={() => setSelectedChannelId(channel.id)}
            >
              <strong>
                {channel.type === 'text' ? '# ' : '🔊 '}
                {channel.name}
              </strong>
              <AccessBadge isPrivate={channel.isPrivate} language={language} />
            </button>
          ))}
        </div>
          </>
        ) : workspaceMode === 'friends' ? (
          <>
            <div className="sidebar-header">
              <div>
                <span className="badge">{i18n.friendsTab}</span>
                <h2>{i18n.directMessages}</h2>
              </div>
            </div>
            <div className="panel server-summary">
              <div className="panel-heading">
                <strong>{i18n.friendRequests}</strong>
                <span>{friendsPanelTab === 'requests' ? friendRequests.length : conversations.length}</span>
              </div>
              <div className="inline-actions segmented-tabs">
                <button
                  className={friendsPanelTab === 'requests' ? 'primary-button' : 'ghost-button'}
                  type="button"
                  onClick={() => setFriendsPanelTab('requests')}
                >
                  {i18n.requestsTab}
                </button>
                <button
                  className={friendsPanelTab === 'conversations' ? 'primary-button' : 'ghost-button'}
                  type="button"
                  onClick={() => setFriendsPanelTab('conversations')}
                >
                  {i18n.dialogsTab}
                </button>
              </div>
              {friendsPanelTab === 'requests' ? (
                <div className="member-list">
                {friendRequests.length === 0 ? <div className="panel compact-note"><strong>{i18n.friendRequests}</strong><span className="helper-text">{i18n.noFriends}</span></div> : null}
                {friendRequests.map((request) => {
                  const partner = request.direction === 'incoming' ? request.requester : request.recipient;
                  return (
                    <div key={request.id} className="member-card social-card social-card-split">
                      <div className="social-card-head">
                        <UserIdentity
                          displayName={partner.displayName}
                          username={partner.username}
                          avatarUrl={partner.avatarUrl}
                          subtitle={`@${partner.username}`}
                        />
                        <span className={onlineUserIds.includes(partner.id) ? 'status-pill status-pill-online' : 'status-pill'}>
                          {onlineUserIds.includes(partner.id) ? i18n.online : i18n.offline}
                        </span>
                      </div>
                      <div className="social-card-actions">
                        {request.direction === 'incoming' ? (
                          <button className="primary-button" type="button" onClick={() => void handleAcceptFriendRequest(request.id)}>
                            {i18n.accept}
                          </button>
                        ) : (
                          <button className="ghost-button" type="button" onClick={() => void handleCopy(partner.id, i18n.copyId)}>
                            {i18n.copyId}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              ) : (
              <div className="list-block">
              {conversations.length === 0 ? <div className="panel compact-note"><span className="helper-text">{i18n.noConversations}</span></div> : null}
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  className={conversation.id === selectedConversationId ? 'list-item active conversation-item' : 'list-item conversation-item'}
                  type="button"
                  onClick={() => setSelectedConversationId(conversation.id)}
                >
                  <div className="conversation-item-head">
                    <UserIdentity
                      displayName={conversation.participant?.displayName ?? i18n.unknownUser}
                      username={conversation.participant?.username ?? i18n.unknownUser}
                      avatarUrl={conversation.participant?.avatarUrl}
                      subtitle={`@${conversation.participant?.username ?? i18n.unknownUser}`}
                      compact
                    />
                    <span
                      className={
                        onlineUserIds.includes(conversation.participant?.id ?? '')
                          ? 'status-pill status-pill-online'
                          : 'status-pill'
                      }
                    >
                      {onlineUserIds.includes(conversation.participant?.id ?? '') ? i18n.online : i18n.offline}
                    </span>
                  </div>
                  <span className="conversation-snippet">{conversation.lastMessage?.content ?? i18n.startDialog}</span>
                  </button>
              ))}
              </div>
              )}
            </div>
          </>
        ) : (
          <div className="panel form-grid compact">
            <div className="panel-heading">
              <strong>{user?.displayName ?? 'Voistra'}</strong>
            </div>
            <span className="helper-text">@{user?.username ?? 'user'}</span>
          </div>
        )}
      </aside>

      <main className="content-column">
        <header className="topbar panel">
          <div className="topbar-main">
            <div className="topbar-context">
              <span className="badge">
                {workspaceMode === 'servers'
                  ? selectedServer?.name ?? i18n.serverName
                  : workspaceMode === 'friends'
                    ? i18n.friendsTab
                    : i18n.profileTab}
              </span>
              {connectedVoiceSession ? (
                <span className="summary-pill">
                  {language === 'ru' ? `В голосе: ${connectedVoiceSession!.channelName}` : `In voice: ${connectedVoiceSession!.channelName}`}
                </span>
              ) : null}
            </div>
            <h1>
              {workspaceMode === 'servers'
                ? selectedChannel
                  ? selectedChannel!.name
                  : selectedServer?.name ?? i18n.chooseChannel
                : workspaceMode === 'friends'
                  ? selectedConversation?.participant?.displayName ?? i18n.directMessages
                  : i18n.profileSettings}
            </h1>
            {toast ? null : (
              <p>
                {workspaceMode === 'servers' && selectedServer
                  ? `${textChannels.length} ${i18n.textChannels} • ${voiceChannels.length} ${i18n.voiceChannels}`
                  : status}
              </p>
            )}
          </div>
          <div className="meta-grid">
            {workspaceMode === 'servers' ? (
              <>
                <button
                  className={serverDirectoryOpen ? 'ghost-button icon-compact topbar-toggle active' : 'ghost-button icon-compact topbar-toggle'}
                  type="button"
                  onClick={() => setServerDirectoryOpen((current) => !current)}
                  title={language === 'ru' ? 'Серверы' : 'Servers'}
                >
                  <ActionIcon kind="panel" />
                </button>
                <button
                  className={channelPanelOpen ? 'ghost-button icon-compact topbar-toggle active' : 'ghost-button icon-compact topbar-toggle'}
                  type="button"
                  onClick={() => setChannelPanelOpen((current) => !current)}
                  title={language === 'ru' ? 'Каналы' : 'Channels'}
                >
                  <ActionIcon kind="menu" />
                </button>
                <button
                  className={adminPanelOpen ? 'ghost-button icon-compact topbar-toggle active' : 'ghost-button icon-compact topbar-toggle'}
                  type="button"
                  onClick={() => setAdminPanelOpen((current) => !current)}
                  title={language === 'ru' ? 'Управление' : 'Admin'}
                >
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
          onChange={(event) => void handleAvatarFileChange(event)}
        />

        {workspaceMode === 'friends' ? (
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
            onDirectDraftChange={setDirectMessageDraft}
            onSendDirectMessage={handleSendDirectMessage}
            onSearchUsers={handleSearchUsers}
            onSearchQueryChange={setUserSearchQuery}
            onSendFriendRequest={(userId) => void handleSendFriendRequest(userId)}
            onAcceptFriendRequest={(requestId) => void handleAcceptFriendRequest(requestId)}
            onOpenConversation={(userId) => void handleOpenConversation(userId)}
            onCopy={(value, label) => void handleCopy(value, label)}
            onRemoveFriend={(userId) => void handleRemoveFriend(userId)}
          />
        ) : workspaceMode === 'profile' ? (
          <ProfileView
            i18n={i18n}
            language={language}
            user={user!}
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
            onProfilePanelTabChange={setProfilePanelTab}
            onProfileSubmit={handleUpdateProfile}
            onAvatarChoose={() => avatarInputRef.current?.click()}
            onAvatarRemove={() => setProfileForm((current) => ({ ...current, avatarUrl: '' }))}
            onProfileFormChange={(updater) => setProfileForm(updater)}
            onInputDeviceChange={setSelectedInputDeviceId}
            onOutputDeviceChange={setSelectedOutputDeviceId}
            onAudioControlChange={(updater) => setAudioControlForm(updater)}
            onToggleMicrophoneTest={() => void toggleMicrophoneTest()}
            onAudioEnhancementModeChange={applyAudioEnhancementMode}
            renderAudioProcessing={
              <>
                <div className="audio-section-card">
                  <div className="audio-section-heading">
                    <strong>{language === 'ru' ? 'РџСЂРѕС„РёР»СЊ РІРІРѕРґР°' : 'Input profile'}</strong>
                    <span>{language === 'ru' ? 'Р’С‹Р±РµСЂРё, РєР°Рє СЂР°Р±РѕС‚Р°РµС‚ РјРёРєСЂРѕС„РѕРЅ' : 'Choose how your microphone behaves'}</span>
                  </div>
                  <div className="audio-profile-grid">
                    <button
                      className={!profileForm.pushToTalkEnabled && profileForm.noiseSuppressionEnabled ? 'audio-profile-card active' : 'audio-profile-card'}
                      type="button"
                      onClick={() =>
                        setProfileForm((current) => ({
                          ...current,
                          pushToTalkEnabled: false,
                          voiceActivationEnabled: true,
                          noiseSuppressionEnabled: true,
                          echoCancellationEnabled: true,
                          autoGainControlEnabled: true,
                        }))
                      }
                    >
                      <strong>{language === 'ru' ? 'РР·РѕР»СЏС†РёСЏ РіРѕР»РѕСЃР°' : 'Voice isolation'}</strong>
                    </button>
                    <button
                      className={profileForm.pushToTalkEnabled ? 'audio-profile-card active' : 'audio-profile-card'}
                      type="button"
                      onClick={() =>
                        setProfileForm((current) => ({
                          ...current,
                          pushToTalkEnabled: !current.pushToTalkEnabled,
                        }))
                      }
                    >
                      <strong>{language === 'ru' ? 'Р РµР¶РёРј СЂР°С†РёРё' : 'Push to talk'}</strong>
                    </button>
                    <button
                      className={!profileForm.noiseSuppressionEnabled ? 'audio-profile-card active' : 'audio-profile-card'}
                      type="button"
                      onClick={() =>
                        setProfileForm((current) => ({
                          ...current,
                          noiseSuppressionEnabled: false,
                          echoCancellationEnabled: false,
                          autoGainControlEnabled: false,
                        }))
                      }
                    >
                      <strong>{language === 'ru' ? 'РЎС‚СѓРґРёСЏ' : 'Studio'}</strong>
                    </button>
                  </div>
                </div>

                <div className="audio-section-card">
                  <div className="audio-section-heading">
                    <strong>{language === 'ru' ? 'РћР±СЂР°Р±РѕС‚РєР°' : 'Processing'}</strong>
                    <span>{language === 'ru' ? 'РЁСѓРј, СЌС…Рѕ Рё СѓСЃРёР»РµРЅРёРµ' : 'Noise, echo, and gain control'}</span>
                  </div>
                  <div className="switch-grid">
                    <ToggleRow
                      label={i18n.voiceActivation}
                      checked={profileForm.voiceActivationEnabled}
                      onChange={(checked) => setProfileForm((current) => ({ ...current, voiceActivationEnabled: checked }))}
                    />
                    <ToggleRow
                      label={i18n.noiseSuppression}
                      checked={profileForm.noiseSuppressionEnabled}
                      onChange={(checked) => setProfileForm((current) => ({ ...current, noiseSuppressionEnabled: checked }))}
                    />
                    <ToggleRow
                      label={i18n.echoCancellation}
                      checked={profileForm.echoCancellationEnabled}
                      onChange={(checked) => setProfileForm((current) => ({ ...current, echoCancellationEnabled: checked }))}
                    />
                    <ToggleRow
                      label={i18n.autoGainControl}
                      checked={profileForm.autoGainControlEnabled}
                      onChange={(checked) => setProfileForm((current) => ({ ...current, autoGainControlEnabled: checked }))}
                    />
                  </div>
                </div>
              </>
            }
          />
        ) : false ? (
          <section className="workspace-grid workspace-grid-single">
            <div className="panel chat-panel">
              <div className="section-title">
                <h3>{selectedConversation?.participant?.displayName ?? i18n.directMessages}</h3>
                <span>{directMessages.length} {i18n.messages}</span>
              </div>
              {selectedConversation?.participant ? (
                <div className="social-hero-card">
                  <UserIdentity
                    displayName={selectedConversation!.participant!.displayName}
                    username={selectedConversation!.participant!.username}
                    avatarUrl={selectedConversation!.participant!.avatarUrl}
                    subtitle={`@${selectedConversation!.participant!.username}`}
                  />
                  <div className="social-hero-meta">
                    <span
                      className={
                        onlineUserIds.includes(selectedConversation!.participant!.id)
                          ? 'status-pill status-pill-online'
                          : 'status-pill'
                      }
                    >
                      {onlineUserIds.includes(selectedConversation!.participant!.id) ? i18n.online : i18n.offline}
                    </span>
                    <button className="ghost-button" type="button" onClick={() => void handleCopy(selectedConversation!.participant!.id, i18n.copyId)}>
                      {i18n.copyId}
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="message-list">
                {directMessages.map((message) => (
                  <article key={message.id} className="message-card">
                    <div className="message-head">
                      <strong>{message.author?.displayName ?? i18n.unknownUser}</strong>
                      <span>{new Date(message.createdAt).toLocaleString()}</span>
                    </div>
                    <p>{message.content}</p>
                  </article>
                ))}
              </div>
              <form className="message-form" onSubmit={handleSendDirectMessage}>
                <input
                  value={directMessageDraft}
                  onChange={(event) => setDirectMessageDraft(event.target.value)}
                  placeholder={i18n.dmPlaceholder}
                />
                <button className="primary-button" type="submit">{i18n.send}</button>
              </form>
            </div>

            <div className="panel side-panel">
              <div className="section-title">
                <h3>{i18n.friendsTab}</h3>
                <span>{friends.length}</span>
              </div>
              <form className="form-grid compact" onSubmit={handleSearchUsers}>
                <input
                  value={userSearchQuery}
                  onChange={(event) => setUserSearchQuery(event.target.value)}
                  placeholder={i18n.searchUsers}
                />
                <button className="ghost-button" type="submit">{i18n.findPeople}</button>
              </form>
              {userSearchResults.length > 0 ? (
                <div className="member-list">
                  {userSearchResults.slice(0, 3).map((result) => (
                    <div key={result.id} className="member-card social-card social-card-split">
                      <UserIdentity
                        displayName={result.displayName}
                        username={result.username}
                        avatarUrl={result.avatarUrl}
                        subtitle={`@${result.username}`}
                      />
                      <div className="inline-actions social-card-actions">
                        <button className="ghost-button" type="button" onClick={() => void handleSendFriendRequest(result.id)}>
                          {i18n.addFriend}
                        </button>
                        <button className="ghost-button" type="button" onClick={() => void handleOpenConversation(result.id)}>
                          {i18n.startDialog}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="member-list">
                {friends.length === 0 ? <span className="helper-text">{i18n.noFriends}</span> : null}
                {friends.map((friend) => (
                  <div key={friend.id} className="member-card social-card social-card-split">
                    <div className="social-card-head">
                      <UserIdentity
                        displayName={friend.displayName}
                        username={friend.username}
                        avatarUrl={friend.avatarUrl}
                        subtitle={`${i18n.friendSince}: ${new Date(friend.connectedAt).toLocaleDateString()}`}
                      />
                      <span className={onlineUserIds.includes(friend.id) ? 'status-pill status-pill-online' : 'status-pill'}>
                        {onlineUserIds.includes(friend.id) ? i18n.online : i18n.offline}
                      </span>
                    </div>
                    <div className="inline-actions social-card-actions">
                      <button className="ghost-button" type="button" onClick={() => void handleOpenConversation(friend.id)}>
                        {i18n.openDialog}
                      </button>
                      <button className="ghost-button" type="button" onClick={() => void handleCopy(friend.id, i18n.copyId)}>
                        {i18n.copyId}
                      </button>
                      <button className="ghost-button" type="button" onClick={() => void handleRemoveFriend(friend.id)}>
                        {i18n.removeFriend}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : false ? (
          <section className="workspace-grid">
            <div className="panel chat-panel">
              <div className="section-title">
                <h3>{i18n.profileSettings}</h3>
              </div>
              <form className="form-grid" onSubmit={handleUpdateProfile}>
                <div className="profile-card-mini profile-card-wide profile-hero-card">
                  <UserAvatarPreview displayName={profileForm.displayName || user!.displayName} avatarUrl={avatarPreview} />
                  <div>
                    <strong>{profileForm.displayName || user!.displayName}</strong>
                    <span className="helper-text">@{user!.username}</span>
                    <span className="profile-avatar-state">
                      {avatarPreview
                        ? language === 'ru'
                          ? 'Превью фото обновлено'
                          : 'Preview ready'
                        : language === 'ru'
                          ? 'Выбери фото профиля'
                          : 'Choose image'}
                    </span>
                  </div>
                </div>
                <div className="inline-actions segmented-tabs">
                  <button
                    className={profilePanelTab === 'account' ? 'primary-button' : 'ghost-button'}
                    type="button"
                    onClick={() => setProfilePanelTab('account')}
                  >
                    {i18n.accountTab}
                  </button>
                  <button
                    className={profilePanelTab === 'security' ? 'primary-button' : 'ghost-button'}
                    type="button"
                    onClick={() => setProfilePanelTab('security')}
                  >
                    {i18n.securityTab}
                  </button>
                  <button
                    className={profilePanelTab === 'audio' ? 'primary-button' : 'ghost-button'}
                    type="button"
                    onClick={() => setProfilePanelTab('audio')}
                  >
                    {i18n.audioTab}
                  </button>
                </div>
                {profilePanelTab === 'account' ? (
                <>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  style={{ display: 'none' }}
                  onChange={(event) => void handleAvatarFileChange(event)}
                />
                <div className="inline-actions avatar-actions-row">
                  <button className="ghost-button" type="button" onClick={() => avatarInputRef.current?.click()}>
                    {i18n.chooseImage}
                  </button>
                  <button className="ghost-button" type="button" onClick={() => setProfileForm((current) => ({ ...current, avatarUrl: '' }))}>
                    {i18n.removeImage}
                  </button>
                </div>
                <label>
                  {i18n.displayName}
                  <input
                    value={profileForm.displayName}
                    onChange={(event) => setProfileForm((current) => ({ ...current, displayName: event.target.value }))}
                  />
                </label>
                <label>
                  {i18n.bio}
                  <input
                    value={profileForm.bio}
                    onChange={(event) => setProfileForm((current) => ({ ...current, bio: event.target.value }))}
                  />
                </label>
                </>
                ) : null}
                {profilePanelTab === 'security' ? (
                <>
                <label>
                  {i18n.currentPassword}
                  <input
                    type="password"
                    value={profileForm.currentPassword}
                    onChange={(event) => setProfileForm((current) => ({ ...current, currentPassword: event.target.value }))}
                  />
                </label>
                <label>
                  {i18n.newPassword}
                  <input
                    type="password"
                    value={profileForm.newPassword}
                    onChange={(event) => setProfileForm((current) => ({ ...current, newPassword: event.target.value }))}
                  />
                </label>
                </>
                ) : null}
                {profilePanelTab === 'audio' ? (
                <div className="audio-settings-shell">
                  <div className="audio-section-card">
                    <div className="audio-section-heading">
                      <strong>{language === 'ru' ? 'Устройства' : 'Devices'}</strong>
                      <span>{language === 'ru' ? 'Ввод и вывод' : 'Input and output'}</span>
                    </div>
                  <div className="audio-device-grid">
                    <label>
                      {language === 'ru' ? 'Микрофон' : 'Microphone'}
                      <select value={selectedInputDeviceId} onChange={(event) => setSelectedInputDeviceId(event.target.value)}>
                        {inputDevices.length === 0 ? <option value="default">{currentInputDeviceLabel}</option> : null}
                        {inputDevices.map((device) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || currentInputDeviceLabel}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      {language === 'ru' ? 'Динамик' : 'Speaker'}
                      <select value={selectedOutputDeviceId} onChange={(event) => setSelectedOutputDeviceId(event.target.value)}>
                        {outputDevices.length === 0 ? <option value="default">{currentOutputDeviceLabel}</option> : null}
                        {outputDevices.map((device) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || currentOutputDeviceLabel}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  </div>

                  <div className="audio-section-card">
                    <div className="audio-section-heading">
                      <strong>{language === 'ru' ? 'Уровни' : 'Levels'}</strong>
                      <span>{language === 'ru' ? 'Чувствительность и громкость' : 'Input sensitivity and output volume'}</span>
                    </div>
                  <div className="audio-slider-grid">
                    <label className="slider-field">
                      <span>{i18n.inputLevel}</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={audioControlForm.inputLevel}
                        onChange={(event) =>
                          setAudioControlForm((current) => ({ ...current, inputLevel: Number(event.target.value) }))
                        }
                      />
                    </label>
                    <label className="slider-field">
                      <span>{i18n.outputLevel}</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={audioControlForm.outputLevel}
                        onChange={(event) =>
                          setAudioControlForm((current) => ({ ...current, outputLevel: Number(event.target.value) }))
                        }
                      />
                    </label>
                  </div>

                  <div className="audio-test-row">
                    <button className="primary-button" type="button" onClick={() => void toggleMicrophoneTest()}>
                      {micTestRunning ? (language === 'ru' ? 'Остановить тест' : 'Stop test') : i18n.testVoice}
                    </button>
                    <div className="mic-meter" aria-hidden="true">
                      {Array.from({ length: 40 }).map((_, index) => (
                        <span
                          key={index}
                          className={index < Math.round(micTestLevel / 2.5) ? 'mic-meter-bar active' : 'mic-meter-bar'}
                        />
                      ))}
                    </div>
                  </div>
                  </div>

                  <div className="audio-section-card">
                    <div className="audio-section-heading">
                      <strong>{language === 'ru' ? 'Профиль ввода' : 'Input profile'}</strong>
                      <span>{language === 'ru' ? 'Выбери, как работает микрофон' : 'Choose how your microphone behaves'}</span>
                    </div>
                  <div className="audio-profile-grid">
                    <button
                      className={!profileForm.pushToTalkEnabled && profileForm.noiseSuppressionEnabled ? 'audio-profile-card active' : 'audio-profile-card'}
                      type="button"
                      onClick={() =>
                        setProfileForm((current) => ({
                          ...current,
                          pushToTalkEnabled: false,
                          voiceActivationEnabled: true,
                          noiseSuppressionEnabled: true,
                          echoCancellationEnabled: true,
                          autoGainControlEnabled: true,
                        }))
                      }
                    >
                      <strong>{language === 'ru' ? 'Изоляция голоса' : 'Voice isolation'}</strong>
                    </button>
                    <button
                      className={profileForm.pushToTalkEnabled ? 'audio-profile-card active' : 'audio-profile-card'}
                      type="button"
                      onClick={() =>
                        setProfileForm((current) => ({
                          ...current,
                          pushToTalkEnabled: !current.pushToTalkEnabled,
                        }))
                      }
                    >
                      <strong>{language === 'ru' ? 'Режим рации' : 'Push to talk'}</strong>
                    </button>
                    <button
                      className={!profileForm.noiseSuppressionEnabled ? 'audio-profile-card active' : 'audio-profile-card'}
                      type="button"
                      onClick={() =>
                        setProfileForm((current) => ({
                          ...current,
                          noiseSuppressionEnabled: false,
                          echoCancellationEnabled: false,
                          autoGainControlEnabled: false,
                        }))
                      }
                    >
                      <strong>{language === 'ru' ? 'Студия' : 'Studio'}</strong>
                    </button>
                  </div>
                  </div>

                  <div className="audio-section-card">
                    <div className="audio-section-heading">
                      <strong>{language === 'ru' ? 'Обработка' : 'Processing'}</strong>
                      <span>{language === 'ru' ? 'Шум, эхо и усиление' : 'Noise, echo, and gain control'}</span>
                    </div>
                  <div className="switch-grid">
                    <ToggleRow
                      label={i18n.voiceActivation}
                      checked={profileForm.voiceActivationEnabled}
                      onChange={(checked) => setProfileForm((current) => ({ ...current, voiceActivationEnabled: checked }))}
                    />
                    <ToggleRow
                      label={i18n.noiseSuppression}
                      checked={profileForm.noiseSuppressionEnabled}
                      onChange={(checked) => setProfileForm((current) => ({ ...current, noiseSuppressionEnabled: checked }))}
                    />
                    <ToggleRow
                      label={i18n.echoCancellation}
                      checked={profileForm.echoCancellationEnabled}
                      onChange={(checked) => setProfileForm((current) => ({ ...current, echoCancellationEnabled: checked }))}
                    />
                    <ToggleRow
                      label={i18n.autoGainControl}
                      checked={profileForm.autoGainControlEnabled}
                      onChange={(checked) => setProfileForm((current) => ({ ...current, autoGainControlEnabled: checked }))}
                    />
                  </div>
                  </div>
                </div>
                ) : null}
                <button className="primary-button" type="submit">{i18n.saveProfile}</button>
              </form>
            </div>
          </section>
        ) : selectedChannel?.type === 'text' ? (
          <TextChannelView
            i18n={i18n}
            messages={messages}
            messageDraft={messageDraft}
            onMessageDraftChange={setMessageDraft}
            onSendMessage={handleSendMessage}
            renderSidePanel={adminPanelOpen ? (
            <div className="panel side-panel">
              <div className="section-title">
                <h3>{i18n.serverOverview}</h3>
                <span>{roleLabel(selectedServer?.currentUserRole)}</span>
              </div>
              <div className="inline-actions segmented-tabs">
                <button
                  className={serverPanelTab === 'overview' ? 'primary-button' : 'ghost-button'}
                  type="button"
                  onClick={() => setServerPanelTab('overview')}
                >
                  {i18n.overviewTab}
                </button>
                <button
                  className={serverPanelTab === 'members' ? 'primary-button' : 'ghost-button'}
                  type="button"
                  onClick={() => setServerPanelTab('members')}
                >
                  {i18n.membersTab}
                </button>
                <button
                  className={serverPanelTab === 'settings' ? 'primary-button' : 'ghost-button'}
                  type="button"
                  onClick={() => setServerPanelTab('settings')}
                >
                  {i18n.settingsTab}
                </button>
              </div>

              {serverPanelTab === 'overview' ? (
              <div className="overview-grid">
                <div className="overview-card">
                  <span>{i18n.owner}</span>
                  <strong>{selectedServer?.owner?.displayName ?? i18n.unknownUser}</strong>
                </div>
                <div className="overview-card">
                  <span>{i18n.members}</span>
                  <strong>{selectedServer?.memberCount ?? 0}</strong>
                </div>
                <div className="overview-card">
                  <span>{i18n.channels}</span>
                  <strong>{selectedServer?.channels.length ?? channels.length}</strong>
                </div>
                <div className="overview-card">
                  <span>{i18n.yourRole}</span>
                  <strong>{roleLabel(selectedServer?.currentUserRole)}</strong>
                </div>
              </div>
              ) : null}

              {serverPanelTab === 'settings' && canManageServer && selectedServer ? (
                <div className="admin-shell">
                  <div className="overview-card owner-quick-card">
                    <span>{i18n.ownerQuickActions}</span>
                    <strong>{selectedServer!.id}</strong>
                  </div>
                  <div className="subsection-heading">
                    <strong>{i18n.ownerConsole}</strong>
                    <span>{i18n.serverSettings}</span>
                  </div>
                  <form className="form-grid compact admin-panel" onSubmit={handleUpdateServer}>
                    <label>
                      {i18n.serverName}
                      <input
                        value={serverSettingsForm.name}
                        onChange={(event) =>
                          setServerSettingsForm((current) => ({ ...current, name: event.target.value }))
                        }
                        placeholder={i18n.updateServerName}
                      />
                    </label>
                    <label>
                      {i18n.description}
                      <input
                        value={serverSettingsForm.description}
                        onChange={(event) =>
                          setServerSettingsForm((current) => ({ ...current, description: event.target.value }))
                        }
                        placeholder={i18n.updateDescription}
                      />
                    </label>
                    <button className="primary-button" type="submit">
                      <ActionIcon kind="save" /> {i18n.saveServer}
                    </button>
                  </form>
                </div>
              ) : null}

              {serverPanelTab === 'members' ? (
              <>
              <div className="subsection-heading">
                <strong>{i18n.memberDirectory}</strong>
                <span>{serverMembers.length} {i18n.people}</span>
              </div>
              <div className="member-list">
                {serverMembers.map((member) => (
                  <div key={member.id} className="member-card social-card member-card-menu-host">
                    <div className="member-head">
                      <UserIdentity
                        displayName={member.user?.displayName ?? member.user?.username ?? member.userId}
                        username={member.user?.username ?? i18n.unknownUser}
                        subtitle={`@${member.user?.username ?? i18n.unknownUser}`}
                        compact
                      />
                      <span className="summary-pill">{roleLabel(member.role)}</span>
                    </div>
                    <div className="inline-actions member-head-actions">
                      <button
                        className="ghost-button icon-compact"
                        type="button"
                        onClick={() =>
                          setSelectedMemberActionUserId((current) => (current === member.userId ? '' : member.userId))
                        }
                        title={language === 'ru' ? 'Действия' : 'Actions'}
                      >
                        <ActionIcon kind="more" />
                      </button>
                    </div>
                    {selectedMemberActionUserId === member.userId ? (
                      <div className="member-actions-panel">
                        <span className="member-actions-title">
                          {language === 'ru' ? 'Действия с участником' : 'Member actions'}
                        </span>
                        <button className="ghost-button member-action-button" type="button" onClick={() => void handleCopy(member.userId, i18n.copyId)}>
                          {i18n.copyId}
                        </button>
                        {member.userId !== user?.id ? (
                          <button className="ghost-button member-action-button" type="button" onClick={() => void handleOpenConversation(member.userId)}>
                            {i18n.openDialog}
                          </button>
                        ) : null}
                        {canManageServer && !member.isOwner && member.userId !== user?.id ? (
                          <button className="danger-button member-action-button" type="button" onClick={() => handleRemoveMember(member.userId)}>
                            <ActionIcon kind="remove" /> {language === 'ru' ? 'Удалить с сервера' : 'Remove from server'}
                          </button>
                        ) : null}
                        <button
                          className="ghost-button member-action-button"
                          type="button"
                          onClick={() => setSelectedMemberActionUserId('')}
                        >
                          {language === 'ru' ? 'Закрыть' : 'Close'}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              </>
              ) : null}
            </div>
            ) : null}
          />
        ) : selectedChannel?.type === 'voice' ? (
          <section className="workspace-grid voice-layout">
            <div className="panel voice-panel">
              <div className="section-title">
                <h3>{i18n.voiceControl}</h3>
                <span>{participants.length} {i18n.people}</span>
              </div>

              <div className="voice-toolbar">
                <div className="control-cluster">
                  <button className="primary-button" type="button" onClick={joinVoiceChannel} title={i18n.joinVoice}>
                    <ActionIcon kind="join" /> {i18n.joinVoice}
                  </button>
                  <button className="ghost-button" type="button" onClick={leaveVoiceChannel} title={i18n.leaveVoice}>
                    <ActionIcon kind="leave" /> {i18n.leaveVoice}
                  </button>
                </div>

                <div className="control-cluster">
                  <button
                    className={voiceFlags.muted ? 'danger-button icon-compact' : 'ghost-button icon-compact'}
                    type="button"
                    title={voiceFlags.muted ? i18n.unmute : i18n.mute}
                    onClick={() => emitVoiceState({ muted: !voiceFlags.muted })}
                  >
                    <ActionIcon kind="mute" />
                  </button>
                  <button
                    className={voiceFlags.deafened ? 'danger-button icon-compact' : 'ghost-button icon-compact'}
                    type="button"
                    title={voiceFlags.deafened ? i18n.undeafen : i18n.deafen}
                    onClick={() => emitVoiceState({ deafened: !voiceFlags.deafened })}
                  >
                    <ActionIcon kind="ear" />
                  </button>
                  <button
                    className={screenShareEnabled ? 'primary-button icon-compact' : 'ghost-button icon-compact'}
                    type="button"
                    title={screenShareEnabled ? i18n.stopShare : i18n.startShare}
                    onClick={() => (screenShareEnabled ? stopScreenShare() : void startScreenShare())}
                  >
                    <ActionIcon kind="screen" />
                  </button>
                  {canCreateChannel ? (
                    <button className="danger-button icon-compact" type="button" onClick={handleRemoveChannel} title={i18n.deleteChannel}>
                      <ActionIcon kind="remove" />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="voice-summary-strip">
                <div className="voice-summary-card">
                  <span>{i18n.voiceMembers}</span>
                  <strong>{participants.length}</strong>
                </div>
                <div className="voice-summary-card">
                  <span>{i18n.liveShares}</span>
                  <strong>{activeShareEntries.length}</strong>
                </div>
                <div className="voice-summary-card">
                  <span>{i18n.screenShare}</span>
                  <strong>{screenShareEnabled ? i18n.live : i18n.inactive}</strong>
                </div>
              </div>

              <div className="participants-grid">
                <div className="section-title section-title-inline">
                  <h3>{i18n.voiceMembers}</h3>
                  <span>{participants.length} {i18n.people}</span>
                </div>
                {participants.map((participant) => (
                  <div key={participant.userId} className="participant-card">
                    <div className="participant-head">
                      <strong>{participant.username}</strong>
                      <div className="participant-status-icons">
                        {participant.muted ? <span className="status-icon status-icon-danger" title={i18n.mutedState}><ActionIcon kind="mute" /></span> : null}
                        {participant.deafened ? <span className="status-icon" title={i18n.deafenedState}><ActionIcon kind="ear" /></span> : null}
                        {activeScreenShares[participant.userId] ? <span className="share-badge discord-live-badge">{language === 'ru' ? 'В эфире' : 'LIVE'}</span> : null}
                      </div>
                    </div>
                    <label className="slider-field">
                      <span>{i18n.participantVolume}</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={remoteParticipantVolumes[participant.userId] ?? 100}
                        onChange={(event) =>
                          setRemoteParticipantVolumes((current) => ({
                            ...current,
                            [participant.userId]: Number(event.target.value),
                          }))
                        }
                      />
                    </label>
                  </div>
                ))}
              </div>

              <div className="remote-media-list">
                {Object.entries(remoteMedia).map(([remoteUserId, media]) => (
                  <RemoteMediaView
                    key={remoteUserId}
                    label={participants.find((participant) => participant.userId === remoteUserId)?.username ?? remoteUserId}
                    audioStream={media.audioStream}
                    screenStream={activeScreenShares[remoteUserId] ? media.screenStream : undefined}
                    muted={voiceFlags.deafened}
                    volume={clampMediaVolume(((remoteParticipantVolumes[remoteUserId] ?? 100) / 100) * (audioControlForm.outputLevel / 100))}
                    shareLevel={remoteShareVolumes[remoteUserId] ?? 100}
                    shareVolume={clampMediaVolume(((remoteShareVolumes[remoteUserId] ?? 100) / 100) * (audioControlForm.outputLevel / 100))}
                    outputDeviceId={selectedOutputDeviceId}
                    language={language}
                    onShareVolumeChange={(value) =>
                      setRemoteShareVolumes((current) => ({
                        ...current,
                        [remoteUserId]: value,
                      }))
                    }
                  />
                ))}
              </div>
            </div>

            <div className="panel chat-panel voice-chat-panel">
              <div className="section-title">
                <h3>{i18n.linkedTextRoom}</h3>
                <span>{messages.length} {i18n.messages}</span>
              </div>
              {textChannels.length > 0 ? (
                <label className="voice-text-selector">
                  <span>{i18n.textChannels}</span>
                  <select
                    value={linkedTextChannel?.id ?? ''}
                    onChange={(event) => setSelectedTextChannelId(event.target.value)}
                  >
                    {textChannels.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        {channel.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <div className="message-list">
                {messages.map((message) => (
                  <article key={message.id} className="message-card">
                    <div className="message-head">
                      <strong>{message.author?.displayName ?? i18n.unknownUser}</strong>
                      <span>{new Date(message.createdAt).toLocaleString()}</span>
                    </div>
                    <p>{message.content}</p>
                  </article>
                ))}
              </div>
              <form className="message-form" onSubmit={handleSendMessage}>
                <input
                  value={messageDraft}
                  onChange={(event) => setMessageDraft(event.target.value)}
                  placeholder={i18n.typeMessage}
                />
                <button className="primary-button" type="submit">
                  {i18n.send}
                </button>
              </form>
            </div>

            <div className="stack-column">
              <div className="panel screen-panel">
                <div className="section-title">
                  <h3>{i18n.screenShare}</h3>
                  <span>{screenShareEnabled ? screenShareLabel : i18n.inactive}</span>
                </div>
                <div className="screen-actions">
                  <button className="primary-button" type="button" onClick={startScreenShare}>
                    <ActionIcon kind="screen" /> {i18n.startShare}
                  </button>
                  <button className="ghost-button" type="button" onClick={stopScreenShare}>
                    <ActionIcon kind="stop" /> {i18n.stopShare}
                  </button>
                </div>
                <div className="screen-share-toggle-row">
                  <span>{i18n.allowStreamAudio}</span>
                  <ToggleSwitch checked={shareSystemAudioEnabled} onChange={setShareSystemAudioEnabled} />
                </div>
                <div className="screen-preview-shell">
                  <video ref={previewVideoRef} autoPlay muted playsInline className="screen-preview" />
                </div>
              </div>

              <div className="panel share-panel">
                <div className="section-title">
                  <h3>{i18n.liveShares}</h3>
                  <span>{activeShareEntries.length} {i18n.activeNow}</span>
                </div>
                {activeShareEntries.length === 0 ? (
                  <p className="helper-text">{i18n.noShares}</p>
                ) : (
                  <div className="share-grid">
                    {activeShareEntries.map((share) => (
                      <div key={share.userId} className="share-card">
                        <div className="share-card-head">
                          <strong>{share.label}</strong>
                          <span className="share-badge discord-live-badge">{language === 'ru' ? 'В эфире' : 'LIVE'}</span>
                        </div>
                        <span>{share.sourceName}</span>
                        <span>{i18n.channelPeers}: {Math.max(participants.length - 1, 0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : selectedServer ? (
          adminPanelOpen ? (
            <section className="server-home-shell">
              <div className="panel server-home-hero">
                <div className="section-title">
                  <h3>{selectedServer!.name}</h3>
                  <button className="ghost-button icon-compact" type="button" onClick={() => setAdminPanelOpen(false)}>
                    <ActionIcon kind="close" />
                  </button>
                </div>
                <div className="inline-actions segmented-tabs">
                  <button
                    className={serverPanelTab === 'overview' ? 'primary-button' : 'ghost-button'}
                    type="button"
                    onClick={() => setServerPanelTab('overview')}
                  >
                    {i18n.overviewTab}
                  </button>
                  <button
                    className={serverPanelTab === 'members' ? 'primary-button' : 'ghost-button'}
                    type="button"
                    onClick={() => setServerPanelTab('members')}
                  >
                    {i18n.membersTab}
                  </button>
                  <button
                    className={serverPanelTab === 'settings' ? 'primary-button' : 'ghost-button'}
                    type="button"
                    onClick={() => setServerPanelTab('settings')}
                  >
                    {i18n.settingsTab}
                  </button>
                </div>
              </div>

              {serverPanelTab === 'overview' ? (
                <div className="server-home-grid">
                  <div className="panel server-home-card">
                    <div className="overview-grid">
                      <div className="overview-card">
                        <span>{i18n.owner}</span>
                        <strong>{selectedServer!.owner?.displayName ?? i18n.unknownUser}</strong>
                      </div>
                      <div className="overview-card">
                        <span>{i18n.members}</span>
                        <strong>{selectedServer!.memberCount}</strong>
                      </div>
                      <div className="overview-card">
                        <span>{i18n.textChannels}</span>
                        <strong>{textChannels.length}</strong>
                      </div>
                      <div className="overview-card">
                        <span>{i18n.voiceChannels}</span>
                        <strong>{voiceChannels.length}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {serverPanelTab === 'members' ? (
                <div className="panel server-home-card">
                  <div className="member-list">
                    {serverMembers.map((member) => (
                      <div key={member.id} className="member-card social-card member-card-menu-host">
                        <div className="member-head">
                          <UserIdentity
                            displayName={member.user?.displayName ?? member.user?.username ?? member.userId}
                            username={member.user?.username ?? i18n.unknownUser}
                            subtitle={`@${member.user?.username ?? i18n.unknownUser}`}
                            compact
                          />
                          <span className="summary-pill">{roleLabel(member.role)}</span>
                        </div>
                        <div className="inline-actions member-head-actions">
                          <button
                            className="ghost-button icon-compact"
                            type="button"
                            onClick={() =>
                              setSelectedMemberActionUserId((current) => (current === member.userId ? '' : member.userId))
                            }
                            title={language === 'ru' ? 'Действия' : 'Actions'}
                          >
                            <ActionIcon kind="more" />
                          </button>
                        </div>
                        {selectedMemberActionUserId === member.userId ? (
                          <div className="member-actions-panel">
                            <button className="ghost-button member-action-button" type="button" onClick={() => void handleCopy(member.userId, i18n.copyId)}>
                              {i18n.copyId}
                            </button>
                            {member.userId !== user?.id ? (
                              <button className="ghost-button member-action-button" type="button" onClick={() => void handleOpenConversation(member.userId)}>
                                {i18n.openDialog}
                              </button>
                            ) : null}
                            {canManageServer && !member.isOwner && member.userId !== user?.id ? (
                              <button className="danger-button member-action-button" type="button" onClick={() => handleRemoveMember(member.userId)}>
                                <ActionIcon kind="remove" /> {language === 'ru' ? 'Удалить с сервера' : 'Remove from server'}
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {serverPanelTab === 'settings' ? (
                <div className="server-home-grid">
                  {canCreateChannel ? (
                    <form className="panel form-grid compact" onSubmit={handleCreateChannel}>
                      <div className="panel-heading">
                        <strong>{i18n.createChannel}</strong>
                        <span>{i18n.text} / {i18n.voice}</span>
                      </div>
                      <label>
                        {i18n.serverName}
                        <input
                          value={createChannelForm.name}
                          onChange={(event) => setCreateChannelForm((current) => ({ ...current, name: event.target.value }))}
                          placeholder={i18n.general}
                          required
                        />
                      </label>
                      <label>
                        {i18n.status}
                        <select
                          value={createChannelForm.type}
                          onChange={(event) =>
                            setCreateChannelForm((current) => ({
                              ...current,
                              type: event.target.value as 'text' | 'voice',
                            }))
                          }
                        >
                          <option value="text">{i18n.text}</option>
                          <option value="voice">{i18n.voice}</option>
                        </select>
                      </label>
                      <label className="checkbox-row">
                        <input
                          type="checkbox"
                          checked={createChannelForm.isPrivate}
                          onChange={(event) =>
                            setCreateChannelForm((current) => ({
                              ...current,
                              isPrivate: event.target.checked,
                              password: event.target.checked ? current.password : '',
                            }))
                          }
                        />
                        {i18n.privateChannel}
                      </label>
                      {createChannelForm.isPrivate ? (
                        <label>
                          {i18n.channelPassword}
                          <input
                            type="password"
                            value={createChannelForm.password}
                            onChange={(event) =>
                              setCreateChannelForm((current) => ({ ...current, password: event.target.value }))
                            }
                            placeholder={i18n.channelPassword}
                          />
                        </label>
                      ) : null}
                      <button className="primary-button" type="submit" disabled={!selectedServerId || !canCreateChannel}>
                        <ActionIcon kind="plus" /> {i18n.createChannel}
                      </button>
                    </form>
                  ) : null}

                  {canManageServer ? (
                    <form className="panel form-grid compact" onSubmit={handleUpdateServer}>
                      <div className="panel-heading">
                        <strong>{i18n.serverSettings}</strong>
                        <span>ID: {selectedServer!.id}</span>
                      </div>
                      <label>
                        {i18n.serverName}
                        <input
                          value={serverSettingsForm.name}
                          onChange={(event) =>
                            setServerSettingsForm((current) => ({ ...current, name: event.target.value }))
                          }
                          placeholder={i18n.updateServerName}
                        />
                      </label>
                      <label>
                        {i18n.description}
                        <input
                          value={serverSettingsForm.description}
                          onChange={(event) =>
                            setServerSettingsForm((current) => ({ ...current, description: event.target.value }))
                          }
                          placeholder={i18n.updateDescription}
                        />
                      </label>
                      <button className="primary-button" type="submit">
                        <ActionIcon kind="save" /> {i18n.saveServer}
                      </button>
                    </form>
                  ) : null}

                  {canManageServer ? (
                    <div className="panel form-grid compact">
                      <div className="panel-heading">
                        <strong>{i18n.channels}</strong>
                        <span>{channels.length}</span>
                      </div>
                      <div className="member-list">
                        {channels.map((channel) => {
                          const draft = channelSettingsDrafts[channel.id] ?? {
                            name: channel.name,
                            isPrivate: channel.isPrivate,
                            password: '',
                          };

                          return (
                            <div key={channel.id} className="member-card admin-channel-card">
                              <label>
                                {i18n.serverName}
                                <input
                                  value={draft.name}
                                  onChange={(event) =>
                                    setChannelSettingsDrafts((current) => ({
                                      ...current,
                                      [channel.id]: { ...draft, name: event.target.value },
                                    }))
                                  }
                                />
                              </label>
                              <div className="server-meta">
                                <span>{channel.type === 'text' ? i18n.text : i18n.voice}</span>
                                <span>ID: {channel.id}</span>
                              </div>
                              <label className="checkbox-row">
                                <input
                                  type="checkbox"
                                  checked={draft.isPrivate}
                                  onChange={(event) =>
                                    setChannelSettingsDrafts((current) => ({
                                      ...current,
                                      [channel.id]: { ...draft, isPrivate: event.target.checked, password: event.target.checked ? draft.password : '' },
                                    }))
                                  }
                                />
                                {i18n.privateChannel}
                              </label>
                              {draft.isPrivate ? (
                                <label>
                                  {i18n.channelPassword}
                                  <input
                                    type="password"
                                    value={draft.password}
                                    onChange={(event) =>
                                      setChannelSettingsDrafts((current) => ({
                                        ...current,
                                        [channel.id]: { ...draft, password: event.target.value },
                                      }))
                                    }
                                    placeholder={language === 'ru' ? 'Новый пароль канала' : 'New channel password'}
                                  />
                                </label>
                              ) : null}
                              <div className="inline-actions">
                                <button className="ghost-button" type="button" onClick={() => void handleUpdateChannel(channel.id)}>
                                  <ActionIcon kind="save" /> {language === 'ru' ? 'Обновить канал' : 'Update channel'}
                                </button>
                                <button className="danger-button" type="button" onClick={() => void handleRemoveSpecificChannel(channel.id)}>
                                  <ActionIcon kind="remove" /> {language === 'ru' ? 'Удалить канал' : 'Delete channel'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : (
            <section className="server-home-shell">
              <div className="panel server-home-hero">
                <span className="badge">{roleLabel(selectedServer!.currentUserRole)}</span>
                <h3>{selectedServer!.name}</h3>
                <p>{selectedServer!.description || i18n.noDescription}</p>
                <div className="summary-pills">
                  <span className="summary-pill">{selectedServer!.memberCount} {i18n.members}</span>
                  <span className="summary-pill">{textChannels.length} {i18n.textChannels}</span>
                  <span className="summary-pill">{voiceChannels.length} {i18n.voiceChannels}</span>
                </div>
              </div>
              <div className="server-home-grid">
                <div className="panel server-home-card">
                  <div className="section-title">
                    <h3>{i18n.textChannels}</h3>
                    <span>{textChannels.length}</span>
                  </div>
                  <div className="member-list">
                    {textChannels.map((channel) => (
                      <button key={channel.id} className="list-item" type="button" onClick={() => void handleSelectChannel(channel)}>
                        <strong><ChannelGlyph type={channel.type} /> {channel.name}</strong>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="panel server-home-card">
                  <div className="section-title">
                    <h3>{i18n.voiceChannels}</h3>
                    <span>{voiceChannels.length}</span>
                  </div>
                  <div className="member-list">
                    {voiceChannels.map((channel) => (
                      <button key={channel.id} className="list-item" type="button" onClick={() => void handleSelectChannel(channel)}>
                        <strong><ChannelGlyph type={channel.type} /> {channel.name}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )
        ) : (
          <section className="empty-state panel">
            <LogoMark />
            <div className="empty-markers">
              <ChannelGlyph type="text" />
              <ChannelGlyph type="voice" />
            </div>
            <h3>{i18n.selectChannelBegin}</h3>
            <p>{i18n.selectChannelHelp}</p>
          </section>
        )}

        {error ? <div className="error-box sticky-error">{error}</div> : null}
      </main>

      {toast ? <div className="toast-banner">{toast}</div> : null}

      {serverModalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setServerModalOpen(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="section-title">
              <h3>{i18n.newServer}</h3>
              <button className="ghost-button icon-compact" type="button" onClick={() => setServerModalOpen(false)}>
                <ActionIcon kind="close" />
              </button>
            </div>
            <div className="server-modal-grid">
              <form className="panel form-grid compact" onSubmit={async (event) => { await handleCreateServer(event); setServerModalOpen(false); }}>
                <div className="panel-heading">
                  <strong>{i18n.createServer}</strong>
                </div>
                <label>
                  {i18n.serverName}
                  <input
                    value={createServerForm.name}
                    onChange={(event) => setCreateServerForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder={i18n.serverDraftName}
                    required
                  />
                </label>
                <label>
                  {i18n.description}
                  <input
                    value={createServerForm.description}
                    onChange={(event) =>
                      setCreateServerForm((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder={i18n.serverDraftDescription}
                  />
                </label>
                <button className="primary-button" type="submit">
                  <ActionIcon kind="plus" /> {i18n.createServer}
                </button>
              </form>

              <form className="panel form-grid compact" onSubmit={async (event) => { await handleJoinServer(event); setServerModalOpen(false); }}>
                <div className="panel-heading">
                  <strong>{i18n.joinServer}</strong>
                </div>
                <label>
                  {i18n.joinByServerId}
                  <input
                    value={joinServerForm.serverId}
                    onChange={(event) => setJoinServerForm({ serverId: event.target.value })}
                    placeholder={i18n.pasteServerId}
                  />
                </label>
                <button className="ghost-button" type="submit">
                  <ActionIcon kind="link" /> {i18n.joinServer}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {avatarEditor ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setAvatarEditor(null)}>
          <div className="modal-card avatar-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="section-title">
              <h3>{language === 'ru' ? 'Редактор фото' : 'Avatar editor'}</h3>
            </div>
            <div className="avatar-editor-stage">
              <div className="avatar-editor-frame">
                <img
                  src={avatarEditor!.source}
                  alt="avatar preview"
                  style={{
                    transform: `translate(${avatarEditor!.offsetX}px, ${avatarEditor!.offsetY}px) scale(${avatarEditor!.scale})`,
                  }}
                />
              </div>
            </div>
            <div className="audio-settings-shell">
              <label className="slider-field">
                <span>{language === 'ru' ? 'Масштаб' : 'Zoom'}</span>
                <input
                  type="range"
                  min="1"
                  max="2.4"
                  step="0.05"
                  value={avatarEditor!.scale}
                  onChange={(event) =>
                    setAvatarEditor((current) =>
                      current ? { ...current, scale: Number(event.target.value) } : current,
                    )
                  }
                />
              </label>
              <label className="slider-field">
                <span>{language === 'ru' ? 'Смещение по горизонтали' : 'Horizontal offset'}</span>
                <input
                  type="range"
                  min="-120"
                  max="120"
                  step="1"
                  value={avatarEditor!.offsetX}
                  onChange={(event) =>
                    setAvatarEditor((current) =>
                      current ? { ...current, offsetX: Number(event.target.value) } : current,
                    )
                  }
                />
              </label>
              <label className="slider-field">
                <span>{language === 'ru' ? 'Смещение по вертикали' : 'Vertical offset'}</span>
                <input
                  type="range"
                  min="-120"
                  max="120"
                  step="1"
                  value={avatarEditor!.offsetY}
                  onChange={(event) =>
                    setAvatarEditor((current) =>
                      current ? { ...current, offsetY: Number(event.target.value) } : current,
                    )
                  }
                />
              </label>
            </div>
            <div className="inline-actions">
              <button className="ghost-button" type="button" onClick={() => setAvatarEditor(null)}>
                {language === 'ru' ? 'Отмена' : 'Cancel'}
              </button>
              <button className="primary-button" type="button" onClick={applyAvatarEditor}>
                {language === 'ru' ? 'Применить фото' : 'Apply image'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function asMessage(error: unknown) {
  const language = (localStorage.getItem(LANGUAGE_KEY) as Language) || 'ru';
  const t = COPY[language];

  if (error instanceof Error) {
    const message = error.message.trim();

    if (message === 'Failed to fetch') {
      return language === 'ru'
        ? 'Не удалось связаться с сервером. Проверь, запущен ли backend.'
        : 'Could not reach the server. Make sure the backend is running.';
    }

    if (message === 'Unauthorized') {
      return language === 'ru' ? 'Сессия истекла. Войди снова.' : 'Your session expired. Please sign in again.';
    }

    if (message === 'Current password is required') {
      return language === 'ru' ? 'Нужен текущий пароль.' : 'Current password is required.';
    }

    if (message === 'Current password is invalid') {
      return language === 'ru' ? 'Текущий пароль неверный.' : 'Current password is invalid.';
    }

    if (message === 'Invalid channel password') {
      return language === 'ru' ? 'Неверный пароль канала.' : 'Invalid channel password.';
    }

    if (message === 'Clipboard is not available') {
      return language === 'ru' ? 'Буфер обмена недоступен.' : 'Clipboard is not available.';
    }

    return message;
  }

  return t.unexpectedError;
}


function AccessBadge({ isPrivate, language }: { isPrivate: boolean; language: Language }) {
  const i18n = COPY[language];

  return (
    <span
      className={isPrivate ? 'access-badge access-badge-private' : 'access-badge access-badge-open'}
      title={isPrivate ? i18n.privateState : i18n.openState}
      aria-label={isPrivate ? i18n.privateState : i18n.openState}
    >
      {isPrivate ? '●' : '○'}
    </span>
  );
}

function RemoteMediaView({
  label,
  audioStream,
  screenStream,
  muted,
  volume,
  shareLevel,
  shareVolume,
  outputDeviceId,
  language,
  onShareVolumeChange,
}: {
  label: string;
  audioStream?: MediaStream;
  screenStream?: MediaStream;
  muted: boolean;
  volume: number;
  shareLevel: number;
  shareVolume: number;
  outputDeviceId: string;
  language: Language;
  onShareVolumeChange: (value: number) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const i18n = COPY[language];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = audioStream ?? null;
      audioRef.current.muted = muted;
      audioRef.current.volume = Math.max(0, Math.min(volume, 1));
      if (audioStream) {
        void audioRef.current.play().catch(() => undefined);
      }
    }
  }, [audioStream, muted, volume]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = screenStream ?? null;
      videoRef.current.volume = Math.max(0, Math.min(shareVolume, 1));
      if (screenStream) {
        void videoRef.current.play().catch(() => undefined);
      }
    }
  }, [screenStream, shareVolume]);

  useEffect(() => {
    if (!outputDeviceId || outputDeviceId === 'default') {
      return;
    }

    void (audioRef.current as HTMLAudioElement & { setSinkId?: (deviceId: string) => Promise<void> } | null)?.setSinkId?.(
      outputDeviceId,
    );
    void (videoRef.current as HTMLVideoElement & { setSinkId?: (deviceId: string) => Promise<void> } | null)?.setSinkId?.(
      outputDeviceId,
    );
  }, [outputDeviceId]);

  if (!audioStream && !screenStream) {
    return null;
  }

  return (
    <div className="remote-media-card">
      <audio ref={audioRef} autoPlay playsInline />
      {screenStream ? (
        <>
          <div className="remote-media-head">
            <div className="remote-media-title">{label} {i18n.remoteScreen}</div>
            <button
              className="ghost-button icon-compact"
              type="button"
              title={i18n.fullscreen}
              onClick={() => void videoRef.current?.requestFullscreen?.()}
            >
              <ActionIcon kind="screen" />
            </button>
          </div>
          <video ref={videoRef} autoPlay playsInline className="remote-screen-preview" />
          <label className="slider-field">
            <span>{i18n.shareVolume}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={shareLevel}
              onChange={(event) => onShareVolumeChange(Number(event.target.value))}
            />
          </label>
        </>
      ) : null}
    </div>
  );
}

