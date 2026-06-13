import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { configureApiSession } from '../../lib/api';
import type { AuthUser, Channel } from '../../types';
import type { AudioEnhancementMode } from '../types';

type RuntimeCopy = {
  browser: string;
  unknown: string;
};

type ProfileForm = {
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

type UseSessionSyncEffectsParams = {
  audioEnhancementMode: AudioEnhancementMode;
  channels: Channel[];
  i18n: RuntimeCopy;
  inputDevices: MediaDeviceInfo[];
  language: 'ru' | 'en';
  outputDevices: MediaDeviceInfo[];
  profileForm: ProfileForm;
  refreshToken: string;
  selectedInputDeviceId: string;
  selectedOutputDeviceId: string;
  selectedServer: { name: string } | null;
  setAudioEnhancementMode: Dispatch<SetStateAction<AudioEnhancementMode>>;
  setAudioPreferences: Dispatch<
    SetStateAction<{
      noiseSuppression: boolean;
      echoCancellation: boolean;
      autoGainControl: boolean;
      pushToTalkEnabled: boolean;
      voiceActivationEnabled: boolean;
    }>
  >;
  setChannelSettingsDrafts: Dispatch<SetStateAction<Record<string, { name: string; isPrivate: boolean; password: string }>>>;
  setPlatform: Dispatch<SetStateAction<string>>;
  setProfileForm: Dispatch<SetStateAction<ProfileForm>>;
  setRefreshToken: Dispatch<SetStateAction<string>>;
  setSelectedInputDeviceId: Dispatch<SetStateAction<string>>;
  setSelectedOutputDeviceId: Dispatch<SetStateAction<string>>;
  setToken: Dispatch<SetStateAction<string>>;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
  setVersion: Dispatch<SetStateAction<string>>;
  storageKeys: {
    accessToken: string;
    audioMode: string;
    language: string;
    refreshToken: string;
    user: string;
  };
  token: string;
  user: AuthUser | null;
};

export function useSessionSyncEffects({
  audioEnhancementMode,
  channels,
  i18n,
  inputDevices,
  language,
  outputDevices,
  profileForm,
  refreshToken,
  selectedInputDeviceId,
  selectedOutputDeviceId,
  selectedServer,
  setAudioEnhancementMode,
  setAudioPreferences,
  setChannelSettingsDrafts,
  setPlatform,
  setProfileForm,
  setRefreshToken,
  setSelectedInputDeviceId,
  setSelectedOutputDeviceId,
  setToken,
  setUser,
  setVersion,
  storageKeys,
  token,
  user,
}: UseSessionSyncEffectsParams) {
  useEffect(() => {
    localStorage.setItem(storageKeys.language, language);
  }, [language, storageKeys.language]);

  useEffect(() => {
    localStorage.setItem(storageKeys.audioMode, audioEnhancementMode);
  }, [audioEnhancementMode, storageKeys.audioMode]);

  useEffect(() => {
    if (!window.desktopApi) {
      setVersion('dev');
      setPlatform(i18n.browser);
      return;
    }

    void window.desktopApi.getVersion().then(setVersion).catch(() => setVersion('dev'));
    void window.desktopApi.getPlatform().then(setPlatform).catch(() => setPlatform(i18n.unknown));
  }, [i18n.browser, i18n.unknown, setPlatform, setVersion]);

  useEffect(() => {
    document.title = selectedServer ? `Voistra - ${selectedServer.name}` : 'Voistra';
  }, [selectedServer]);

  useEffect(() => {
    if (!token) {
      return;
    }

    localStorage.setItem(storageKeys.accessToken, token);
  }, [token, storageKeys.accessToken]);

  useEffect(() => {
    if (!refreshToken) {
      return;
    }

    localStorage.setItem(storageKeys.refreshToken, refreshToken);
  }, [refreshToken, storageKeys.refreshToken]);

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
        localStorage.removeItem(storageKeys.accessToken);
        localStorage.removeItem(storageKeys.refreshToken);
        localStorage.removeItem(storageKeys.user);
      },
    });
  }, [refreshToken, setRefreshToken, setToken, setUser, storageKeys.accessToken, storageKeys.refreshToken, storageKeys.user, token]);

  useEffect(() => {
    if (!user) {
      localStorage.removeItem(storageKeys.user);
      return;
    }

    localStorage.setItem(storageKeys.user, JSON.stringify(user));
  }, [user, storageKeys.user]);

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
  }, [user, setProfileForm]);

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
  }, [user, setAudioPreferences]);

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
  }, [channels, setChannelSettingsDrafts]);

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
    setAudioPreferences,
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
    setAudioEnhancementMode,
  ]);

  useEffect(() => {
    if (selectedInputDeviceId === 'default' && inputDevices[0]?.deviceId) {
      setSelectedInputDeviceId(inputDevices[0].deviceId);
    }
  }, [inputDevices, selectedInputDeviceId, setSelectedInputDeviceId]);

  useEffect(() => {
    if (selectedOutputDeviceId === 'default' && outputDevices[0]?.deviceId) {
      setSelectedOutputDeviceId(outputDevices[0].deviceId);
    }
  }, [outputDevices, selectedOutputDeviceId, setSelectedOutputDeviceId]);
}
