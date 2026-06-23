import { useEffect, useRef } from 'react';

import { ActionIcon } from '../components/app-primitives';
import { COPY } from './app-copy';
import { LANGUAGE_KEY } from './app-storage';
import type { Language } from './types';

type RemoteAudioSinkProps = {
  media: Record<string, { audioStream?: MediaStream }>;
  muted: boolean;
  outputDeviceId: string;
  volumes: Record<string, number>;
  outputLevel: number;
};

function clampMediaVolume(value: number) {
  return Math.max(0, Math.min(value, 1));
}

export function asMessage(error: unknown) {
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

export function AccessBadge({ isPrivate, language }: { isPrivate: boolean; language: Language }) {
  const i18n = COPY[language];

  return (
    <span
      className={isPrivate ? 'access-badge access-badge-private' : 'access-badge access-badge-open'}
      title={isPrivate ? i18n.privateState : i18n.openState}
      aria-label={isPrivate ? i18n.privateState : i18n.openState}
    >
      {isPrivate ? '?' : '0'}
    </span>
  );
}

export function RemoteMediaView({
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
            <div className="remote-media-title">
              {label} {i18n.remoteScreen}
            </div>
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

function RemoteAudioElement({
  muted,
  outputDeviceId,
  stream,
  volume,
}: {
  muted: boolean;
  outputDeviceId: string;
  stream?: MediaStream;
  volume: number;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.srcObject = stream ?? null;
    audioRef.current.muted = muted;
    audioRef.current.volume = clampMediaVolume(volume);
    if (stream) {
      void audioRef.current.play().catch(() => undefined);
    }
  }, [muted, stream, volume]);

  useEffect(() => {
    if (!outputDeviceId || outputDeviceId === 'default') {
      return;
    }

    void (audioRef.current as HTMLAudioElement & { setSinkId?: (deviceId: string) => Promise<void> } | null)?.setSinkId?.(
      outputDeviceId,
    );
  }, [outputDeviceId]);

  return <audio ref={audioRef} autoPlay playsInline />;
}

export function RemoteAudioSink({
  media,
  muted,
  outputDeviceId,
  outputLevel,
  volumes,
}: RemoteAudioSinkProps) {
  return (
    <div aria-hidden="true" style={{ display: 'none' }}>
      {Object.entries(media).map(([userId, remoteMedia]) => (
        <RemoteAudioElement
          key={userId}
          muted={muted}
          outputDeviceId={outputDeviceId}
          stream={remoteMedia.audioStream}
          volume={((volumes[userId] ?? 100) / 100) * (outputLevel / 100)}
        />
      ))}
    </div>
  );
}
