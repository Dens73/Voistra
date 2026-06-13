import { ActionIcon, UserIdentity } from './app-primitives';
import { RemoteMediaView } from '../app/app-ui';
import type { Language, RemoteMedia, VoiceFlags } from '../app/types';
import type { AuthUser, VoiceParticipant } from '../types';

type VoiceParticipantsPanelProps = {
  activeScreenShares: Record<string, string>;
  audioOutputLevel: number;
  i18n: {
    joinVoice: string;
    leaveVoice: string;
    live: string;
    participantVolume: string;
    people: string;
    voiceControl: string;
  };
  language: Language;
  participants: VoiceParticipant[];
  remoteMedia: Record<string, RemoteMedia>;
  remoteParticipantVolumes: Record<string, number>;
  remoteShareVolumes: Record<string, number>;
  screenShareEnabled: boolean;
  selectedOutputDeviceId: string;
  user: AuthUser;
  voiceFlags: VoiceFlags;
  onJoinVoice: () => void | Promise<void>;
  onLeaveVoice: () => void | Promise<void>;
  onSetRemoteParticipantVolume: (updater: (current: Record<string, number>) => Record<string, number>) => void;
  onSetRemoteShareVolume: (updater: (current: Record<string, number>) => Record<string, number>) => void;
  onToggleDeafen: () => void | Promise<void>;
  onToggleMute: () => void | Promise<void>;
  onToggleScreenShare: () => void | Promise<void>;
};

const clampMediaVolume = (value: number) => Math.max(0, Math.min(1, value));

export function VoiceParticipantsPanel({
  activeScreenShares,
  audioOutputLevel,
  i18n,
  language,
  participants,
  remoteMedia,
  remoteParticipantVolumes,
  remoteShareVolumes,
  screenShareEnabled,
  selectedOutputDeviceId,
  user,
  voiceFlags,
  onJoinVoice,
  onLeaveVoice,
  onSetRemoteParticipantVolume,
  onSetRemoteShareVolume,
  onToggleDeafen,
  onToggleMute,
  onToggleScreenShare,
}: VoiceParticipantsPanelProps) {
  return (
    <div className="rounded-[28px] border border-white/6 bg-[#171a1d] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.22)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{i18n.voiceControl}</h3>
          <p className="text-sm text-slate-500">{participants.length} {i18n.people}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white" type="button" onClick={() => void onJoinVoice()}>{i18n.joinVoice}</button>
          <button className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-200" type="button" onClick={() => void onLeaveVoice()}>{i18n.leaveVoice}</button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button className={voiceFlags.muted ? 'inline-grid h-11 w-11 place-items-center rounded-2xl bg-red-500/20 text-red-100' : 'inline-grid h-11 w-11 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300'} type="button" onClick={() => void onToggleMute()}><ActionIcon kind="mute" /></button>
        <button className={voiceFlags.deafened ? 'inline-grid h-11 w-11 place-items-center rounded-2xl bg-red-500/20 text-red-100' : 'inline-grid h-11 w-11 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300'} type="button" onClick={() => void onToggleDeafen()}><ActionIcon kind="ear" /></button>
        <button className={screenShareEnabled ? 'inline-grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500 text-white' : 'inline-grid h-11 w-11 place-items-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300'} type="button" onClick={() => void onToggleScreenShare()}><ActionIcon kind="screen" /></button>
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
                  avatarUrl={isSelf ? user.avatarUrl : undefined}
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
                  <input type="range" min="0" max="100" value={remoteParticipantVolumes[participant.userId] ?? 100} onChange={(event) => onSetRemoteParticipantVolume((current) => ({ ...current, [participant.userId]: Number(event.target.value) }))} />
                </label>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {Object.entries(remoteMedia).map(([remoteUserId, media]) => (
          <RemoteMediaView
            key={remoteUserId}
            label={participants.find((participant) => participant.userId === remoteUserId)?.username ?? remoteUserId}
            audioStream={media.audioStream}
            screenStream={activeScreenShares[remoteUserId] ? media.screenStream : undefined}
            muted={voiceFlags.deafened}
            volume={clampMediaVolume(((remoteParticipantVolumes[remoteUserId] ?? 100) / 100) * (audioOutputLevel / 100))}
            shareLevel={remoteShareVolumes[remoteUserId] ?? 100}
            shareVolume={clampMediaVolume(((remoteShareVolumes[remoteUserId] ?? 100) / 100) * (audioOutputLevel / 100))}
            outputDeviceId={selectedOutputDeviceId}
            language={language}
            onShareVolumeChange={(value) => onSetRemoteShareVolume((current) => ({ ...current, [remoteUserId]: value }))}
          />
        ))}
      </div>
    </div>
  );
}
