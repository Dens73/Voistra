import { useEffect, useRef } from 'react';

import type {
  AccessBadgeProps,
  ActionIconKind,
  ChannelGlyphProps,
  ProfileAvatarProps,
  RemoteMediaViewProps,
  ToggleRowProps,
  ToggleSwitchProps,
  UserAvatarPreviewProps,
  UserIdentityProps,
} from '../app/types';

const baseIconClass = 'h-4 w-4 stroke-[1.9] stroke-current fill-none stroke-linecap-round stroke-linejoin-round';

export function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={compact
        ? 'grid h-11 w-11 place-items-center rounded-2xl border border-emerald-300/12 bg-emerald-400/12'
        : 'grid h-16 w-16 place-items-center rounded-[22px] border border-emerald-300/12 bg-emerald-400/12'}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" role="img" className={compact ? 'h-7 w-7' : 'h-10 w-10'}>
        <rect x="8" y="8" width="48" height="48" rx="18" fill="currentColor" className="text-emerald-400" />
        <path d="M21 28c5-8 17-10 26-3" className="stroke-[#0f1113]" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M21 36c5 8 17 10 26 3" className="stroke-[#0f1113]" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="32" cy="32" r="4" fill="#0f1113" />
      </svg>
    </div>
  );
}

export function ActionIcon({ kind }: { kind: ActionIconKind }) {
  const paths: Record<ActionIconKind, string> = {
    plus: 'M12 5v14M5 12h14',
    link: 'M9 12h6M7 15l-2-2a3 3 0 010-4l2-2a3 3 0 014 0M17 9l2 2a3 3 0 010 4l-2 2a3 3 0 01-4 0',
    save: 'M5 6h12l2 2v11H5zM8 6v5h7',
    join: 'M11 5l7 7-7 7M18 12H6',
    leave: 'M13 5l-7 7 7 7M6 12h12',
    remove: 'M6 12h12',
    mute: 'M12 3a3 3 0 00-3 3v5a3 3 0 006 0V6a3 3 0 00-3-3zm-5 9a5 5 0 0010 0M12 17v4M8 21h8M4 4l16 16',
    ear: 'M12 4a5 5 0 015 5c0 2.1-1 3.3-2.2 4.4C13.7 14.4 13 15 13 16.5V18M12 22h.01',
    talk: 'M12 3a3 3 0 00-3 3v5a3 3 0 006 0V6a3 3 0 00-3-3zm-5 8a5 5 0 0010 0M12 16v5M9 21h6',
    spark: 'M12 4l1.5 4.5L18 10l-4.5 1.5L12 16l-1.5-4.5L6 10l4.5-1.5z',
    pulse: 'M4 12h4l2-4 4 8 2-4h4',
    screen: 'M4 6h16v10H4zM9 20h6',
    stop: 'M7 7h10v10H7z',
    logout: 'M10 5H6v14h4M13 8l5 4-5 4M18 12H9',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    close: 'M6 6l12 12M18 6L6 18',
    copy: 'M9 9h10v11H9zM5 5h10M5 5v11M9 9H7V7',
    message: 'M5 6h14v9H9l-4 4V6z',
    bell: 'M12 4a4 4 0 00-4 4v2.5c0 1-.3 2-.9 2.8L5.8 15h12.4l-1.3-1.7a4.8 4.8 0 01-.9-2.8V8a4 4 0 00-4-4zm-2 14a2 2 0 004 0',
    menu: 'M4 7h16M4 12h16M4 17h16',
    panel: 'M4 5h6v14H4zM12 5h8v14h-8z',
    settings:
      'M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5M19 12l2-1-1-3-2 .2-.9-1.6 1.2-1.7-2.2-2.2-1.7 1.2-1.6-.9.2-2-3-1-1 2h-1.8l-1-2-3 1 .2 2-1.6.9-1.7-1.2-2.2 2.2 1.2 1.7-.9 1.6-2-.2-1 3 2 1v1.8l-2 1 1 3 2-.2.9 1.6-1.2 1.7 2.2 2.2 1.7-1.2 1.6.9-.2 2 3 1 1-2h1.8l1 2 3-1-.2-2 1.6-.9 1.7 1.2 2.2-2.2-1.2-1.7.9-1.6 2 .2 1-3-2-1z',
  };

  return (
    <span className="inline-flex h-4 w-4 items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 24 24" className={baseIconClass}>
        <path d={paths[kind]} />
      </svg>
    </span>
  );
}

export function ChannelGlyph({ type }: ChannelGlyphProps) {
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center text-slate-500" aria-hidden="true">
      <svg viewBox="0 0 24 24" className={baseIconClass}>
        {type === 'text' ? (
          <path d="M9 4L7 20M17 4l-2 16M4 9h16M3 15h16" />
        ) : (
          <path d="M4 10a8 8 0 0016 0M8 10v2a4 4 0 008 0v-2M12 18v2M9 22h6" />
        )}
      </svg>
    </span>
  );
}

export function ProfileAvatar({ user }: ProfileAvatarProps) {
  if (user?.avatarUrl) {
    return <img className="h-11 w-11 rounded-2xl object-cover" src={user.avatarUrl} alt={user.displayName} />;
  }

  const fallback = (user?.displayName || user?.username || 'V').slice(0, 1).toUpperCase();
  return <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-400/14 text-sm font-semibold text-emerald-100">{fallback}</div>;
}

export function UserAvatarPreview({ displayName, avatarUrl }: UserAvatarPreviewProps) {
  const fallback = (displayName || 'V').slice(0, 1).toUpperCase();

  if (avatarUrl) {
    return <img className="h-16 w-16 rounded-[20px] object-cover" src={avatarUrl} alt={displayName} />;
  }

  return <div className="grid h-16 w-16 place-items-center rounded-[20px] bg-emerald-400/14 text-base font-semibold text-emerald-100">{fallback}</div>;
}

export function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      className={checked
        ? 'relative inline-flex h-7 w-12 items-center rounded-full bg-emerald-500 transition'
        : 'relative inline-flex h-7 w-12 items-center rounded-full bg-white/8 transition'}
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
    >
      <span
        className={checked
          ? 'ml-6 inline-block h-5 w-5 rounded-full bg-white transition'
          : 'ml-1 inline-block h-5 w-5 rounded-full bg-white transition'}
      />
    </button>
  );
}

export function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
      <strong className="text-sm font-medium text-slate-100">{label}</strong>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

export function UserIdentity({
  displayName,
  username,
  avatarUrl,
  subtitle,
  compact = false,
}: UserIdentityProps) {
  const fallback = (displayName || username || 'V').slice(0, 1).toUpperCase();
  const avatarClass = compact ? 'h-9 w-9 rounded-xl' : 'h-10 w-10 rounded-2xl';

  return (
    <div className="flex min-w-0 items-center gap-3">
      {avatarUrl ? (
        <img className={`${avatarClass} object-cover`} src={avatarUrl} alt={displayName} />
      ) : (
        <div className={`grid ${avatarClass} place-items-center bg-emerald-400/14 text-xs font-semibold text-emerald-100`}>
          {fallback}
        </div>
      )}
      <div className="min-w-0">
        <strong className="block truncate text-sm font-medium text-slate-100">{displayName}</strong>
        {subtitle ? <span className="block truncate text-xs text-slate-500">{subtitle}</span> : null}
      </div>
    </div>
  );
}

export function AccessBadge({ isPrivate, language }: AccessBadgeProps) {
  const label = isPrivate ? (language === 'ru' ? 'Приватный' : 'Private') : language === 'ru' ? 'Открытый' : 'Open';

  return (
    <span
      className={isPrivate
        ? 'inline-flex rounded-full border border-amber-300/12 bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-100/80'
        : 'inline-flex rounded-full border border-emerald-300/12 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-100/80'}
      title={label}
      aria-label={label}
    >
      {label}
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
}: RemoteMediaViewProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const remoteScreenLabel = language === 'ru' ? 'экран' : 'screen';
  const fullscreenLabel = language === 'ru' ? 'Во весь экран' : 'Fullscreen';
  const shareVolumeLabel = language === 'ru' ? 'Громкость трансляции' : 'Share volume';

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = audioStream ?? null;
      audioRef.current.muted = muted;
      audioRef.current.volume = Math.max(0, Math.min(volume, 1));
      void audioRef.current.play().catch(() => undefined);
    }
  }, [audioStream, muted, volume]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = screenStream ?? null;
      videoRef.current.volume = Math.max(0, Math.min(shareVolume, 1));
      void videoRef.current.play().catch(() => undefined);
    }
  }, [screenStream, shareVolume]);

  useEffect(() => {
    if (!outputDeviceId || outputDeviceId === 'default') {
      return;
    }

    void (audioRef.current as (HTMLAudioElement & { setSinkId?: (deviceId: string) => Promise<void> }) | null)?.setSinkId?.(
      outputDeviceId,
    );
    void (videoRef.current as (HTMLVideoElement & { setSinkId?: (deviceId: string) => Promise<void> }) | null)?.setSinkId?.(
      outputDeviceId,
    );
  }, [outputDeviceId]);

  if (!audioStream && !screenStream) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-3xl border border-white/6 bg-white/[0.03] p-4">
      <audio ref={audioRef} autoPlay playsInline />
      {screenStream ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-slate-100">
              {label} {remoteScreenLabel}
            </div>
            <button
              className="inline-grid h-10 w-10 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.06]"
              type="button"
              title={fullscreenLabel}
              onClick={() => void videoRef.current?.requestFullscreen?.()}
            >
              <ActionIcon kind="screen" />
            </button>
          </div>
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-2xl border border-white/6 bg-[#0f1113]" />
          <label className="grid gap-2 text-xs font-medium text-slate-400">
            <span>{shareVolumeLabel}</span>
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
