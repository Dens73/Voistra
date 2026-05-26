import type { FormEvent, ReactNode } from 'react';

import { UserAvatarPreview } from '../components/app-primitives';
import type { AudioEnhancementMode } from '../app/types';
import type { AuthUser } from '../types';

type ProfileStrings = {
  profileSettings: string;
  accountTab: string;
  securityTab: string;
  audioTab: string;
  chooseImage: string;
  removeImage: string;
  displayName: string;
  bio: string;
  currentPassword: string;
  newPassword: string;
  saveProfile: string;
  testVoice: string;
  inputLevel: string;
  outputLevel: string;
  audioMode: string;
  voiceFocusMode: string;
  balancedMode: string;
  studioMode: string;
  voiceFocusHint: string;
  balancedHint: string;
  studioHint: string;
};

type ProfileFormState = {
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

type ProfileViewProps = {
  i18n: ProfileStrings;
  language: 'ru' | 'en';
  user: AuthUser;
  profilePanelTab: 'account' | 'security' | 'audio';
  profileForm: ProfileFormState;
  avatarPreview?: string | null;
  inputDevices: MediaDeviceInfo[];
  outputDevices: MediaDeviceInfo[];
  selectedInputDeviceId: string;
  selectedOutputDeviceId: string;
  currentInputDeviceLabel: string;
  currentOutputDeviceLabel: string;
  audioControlForm: { inputLevel: number; outputLevel: number };
  micTestRunning: boolean;
  micTestLevel: number;
  audioEnhancementMode: AudioEnhancementMode;
  onProfilePanelTabChange: (tab: 'account' | 'security' | 'audio') => void;
  onProfileSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onAvatarChoose: () => void;
  onAvatarRemove: () => void;
  onProfileFormChange: (updater: (current: ProfileFormState) => ProfileFormState) => void;
  onInputDeviceChange: (value: string) => void;
  onOutputDeviceChange: (value: string) => void;
  onAudioControlChange: (updater: (current: { inputLevel: number; outputLevel: number }) => { inputLevel: number; outputLevel: number }) => void;
  onToggleMicrophoneTest: () => void;
  onAudioEnhancementModeChange: (mode: AudioEnhancementMode) => void;
  renderAudioProcessing?: ReactNode;
};

export function ProfileView({
  i18n,
  language,
  user,
  profilePanelTab,
  profileForm,
  avatarPreview,
  inputDevices,
  outputDevices,
  selectedInputDeviceId,
  selectedOutputDeviceId,
  currentInputDeviceLabel,
  currentOutputDeviceLabel,
  audioControlForm,
  micTestRunning,
  micTestLevel,
  audioEnhancementMode,
  onProfilePanelTabChange,
  onProfileSubmit,
  onAvatarChoose,
  onAvatarRemove,
  onProfileFormChange,
  onInputDeviceChange,
  onOutputDeviceChange,
  onAudioControlChange,
  onToggleMicrophoneTest,
  onAudioEnhancementModeChange,
  renderAudioProcessing,
}: ProfileViewProps) {
  const micLabel = language === 'ru' ? 'Микрофон' : 'Microphone';
  const speakerLabel = language === 'ru' ? 'Динамик' : 'Speaker';
  const previewHint =
    language === 'ru'
      ? 'Превью обновляется сразу. После сохранения аватар появится во всех разделах приложения.'
      : 'Preview updates instantly. After saving, the avatar will appear everywhere in the app.';
  const stopTestLabel = language === 'ru' ? 'Остановить тест' : 'Stop test';
  const accountHint = language === 'ru' ? 'Имя и фото профиля' : 'Identity and profile photo';
  const securityHint = language === 'ru' ? 'Пароль и защита входа' : 'Password and sign-in security';
  const audioHint = language === 'ru' ? 'Микрофон, вывод и обработка голоса' : 'Mic, output, and voice processing';

  return (
    <section className="rounded-[28px] border border-white/6 bg-[#171a1d] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.22)]">
      <form className="space-y-5" onSubmit={onProfileSubmit}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[24px] border border-white/6 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-center gap-4">
              <UserAvatarPreview displayName={profileForm.displayName || user.displayName} avatarUrl={avatarPreview} />
              <div className="min-w-0">
                <h3 className="truncate text-xl font-semibold text-white">{profileForm.displayName || user.displayName}</h3>
                <p className="mt-1 text-sm text-slate-500">@{user.username}</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">{previewHint}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/6 bg-white/[0.03] p-5">
            <div className="grid gap-2">
              <button
                className="h-11 rounded-2xl bg-emerald-500 px-4 text-sm font-semibold text-white transition hover:bg-emerald-400"
                type="button"
                onClick={onAvatarChoose}
              >
                {i18n.chooseImage}
              </button>
              <button
                className="h-11 rounded-2xl border border-white/6 bg-white/[0.03] px-4 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
                type="button"
                onClick={onAvatarRemove}
              >
                {i18n.removeImage}
              </button>
            </div>
          </div>
        </div>

        <div className="inline-flex rounded-2xl border border-white/6 bg-[#121417] p-1">
          {([
            { key: 'account' as const, label: i18n.accountTab },
            { key: 'security' as const, label: i18n.securityTab },
            { key: 'audio' as const, label: i18n.audioTab },
          ]).map((tab) => (
            <button
              key={tab.key}
              className={
                profilePanelTab === tab.key
                  ? 'rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white'
                  : 'rounded-xl px-4 py-2 text-sm font-medium text-slate-400 transition hover:text-white'
              }
              type="button"
              onClick={() => onProfilePanelTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {profilePanelTab === 'account' ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-[24px] border border-white/6 bg-white/[0.03] p-5">
              <div className="mb-4">
                <h4 className="text-base font-semibold text-white">{i18n.accountTab}</h4>
                <p className="mt-1 text-sm text-slate-500">{accountHint}</p>
              </div>
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-medium text-slate-200">
                  <span>{i18n.displayName}</span>
                  <input
                    className="h-12 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/10"
                    value={profileForm.displayName}
                    onChange={(event) => onProfileFormChange((current) => ({ ...current, displayName: event.target.value }))}
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-200">
                  <span>{i18n.bio}</span>
                  <textarea
                    className="min-h-[116px] rounded-2xl border border-white/6 bg-[#121417] px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/10"
                    value={profileForm.bio}
                    onChange={(event) => onProfileFormChange((current) => ({ ...current, bio: event.target.value }))}
                  />
                </label>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/6 bg-white/[0.03] p-5">
              <h4 className="text-base font-semibold text-white">{language === 'ru' ? 'Предпросмотр' : 'Preview'}</h4>
              <div className="mt-4 flex justify-center rounded-[22px] border border-dashed border-white/10 bg-[#121417] px-6 py-8">
                <UserAvatarPreview displayName={profileForm.displayName || user.displayName} avatarUrl={avatarPreview} />
              </div>
            </div>
          </div>
        ) : null}

        {profilePanelTab === 'security' ? (
          <div className="rounded-[24px] border border-white/6 bg-white/[0.03] p-5">
            <div className="mb-4">
              <h4 className="text-base font-semibold text-white">{i18n.securityTab}</h4>
              <p className="mt-1 text-sm text-slate-500">{securityHint}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-200">
                <span>{i18n.currentPassword}</span>
                <input
                  className="h-12 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/10"
                  type="password"
                  value={profileForm.currentPassword}
                  onChange={(event) => onProfileFormChange((current) => ({ ...current, currentPassword: event.target.value }))}
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-200">
                <span>{i18n.newPassword}</span>
                <input
                  className="h-12 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/10"
                  type="password"
                  value={profileForm.newPassword}
                  onChange={(event) => onProfileFormChange((current) => ({ ...current, newPassword: event.target.value }))}
                />
              </label>
            </div>
          </div>
        ) : null}

        {profilePanelTab === 'audio' ? (
          <div className="space-y-4">
            <div className="rounded-[24px] border border-white/6 bg-white/[0.03] p-5">
              <div className="mb-4">
                <h4 className="text-base font-semibold text-white">{i18n.audioMode}</h4>
                <p className="mt-1 text-sm text-slate-500">{audioHint}</p>
              </div>
              <div className="grid gap-3 xl:grid-cols-3">
                {[
                  { key: 'voice_focus' as const, title: i18n.voiceFocusMode, hint: i18n.voiceFocusHint },
                  { key: 'balanced' as const, title: i18n.balancedMode, hint: i18n.balancedHint },
                  { key: 'studio' as const, title: i18n.studioMode, hint: i18n.studioHint },
                ].map((preset) => (
                  <button
                    key={preset.key}
                    className={
                      audioEnhancementMode === preset.key
                        ? 'rounded-3xl border border-emerald-300/18 bg-emerald-400/12 p-4 text-left'
                        : 'rounded-3xl border border-white/6 bg-[#121417] p-4 text-left'
                    }
                    type="button"
                    onClick={() => onAudioEnhancementModeChange(preset.key)}
                  >
                    <strong className="mb-2 block text-sm font-semibold text-white">{preset.title}</strong>
                    <span className="text-xs leading-6 text-slate-500">{preset.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-[24px] border border-white/6 bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-white">{micLabel}</h4>
                    <p className="mt-1 text-sm text-slate-500">{currentInputDeviceLabel}</p>
                  </div>
                </div>
                <select
                  className="h-12 w-full rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none"
                  value={selectedInputDeviceId}
                  onChange={(event) => onInputDeviceChange(event.target.value)}
                >
                  {inputDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || micLabel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-[24px] border border-white/6 bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-white">{speakerLabel}</h4>
                    <p className="mt-1 text-sm text-slate-500">{currentOutputDeviceLabel}</p>
                  </div>
                </div>
                <select
                  className="h-12 w-full rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none"
                  value={selectedOutputDeviceId}
                  onChange={(event) => onOutputDeviceChange(event.target.value)}
                >
                  <option value="default">{currentOutputDeviceLabel}</option>
                  {outputDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || speakerLabel}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/6 bg-white/[0.03] p-5">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px] xl:items-end">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-slate-200">
                    <span>{i18n.inputLevel}</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={audioControlForm.inputLevel}
                      onChange={(event) =>
                        onAudioControlChange((current) => ({
                          ...current,
                          inputLevel: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-200">
                    <span>{i18n.outputLevel}</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={audioControlForm.outputLevel}
                      onChange={(event) =>
                        onAudioControlChange((current) => ({
                          ...current,
                          outputLevel: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                </div>

                <button
                  className="h-12 rounded-2xl bg-emerald-500 px-4 text-sm font-semibold text-white transition hover:bg-emerald-400"
                  type="button"
                  onClick={onToggleMicrophoneTest}
                >
                  {micTestRunning ? stopTestLabel : i18n.testVoice}
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2">
                {Array.from({ length: 36 }).map((_, index) => (
                  <span
                    key={index}
                    className={
                      index < Math.round(micTestLevel / 3)
                        ? 'h-2.5 flex-1 rounded-full bg-emerald-400'
                        : 'h-2.5 flex-1 rounded-full bg-white/8'
                    }
                  />
                ))}
              </div>
            </div>

            {renderAudioProcessing}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button className="h-12 rounded-2xl bg-emerald-500 px-5 text-sm font-semibold text-white transition hover:bg-emerald-400" type="submit">
            {i18n.saveProfile}
          </button>
        </div>
      </form>
    </section>
  );
}
