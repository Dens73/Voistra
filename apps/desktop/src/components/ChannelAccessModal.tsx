import type { FormEvent } from 'react';

import type { Language } from '../app/types';

type ChannelAccessModalProps = {
  channelName: string;
  language: Language;
  open: boolean;
  password: string;
  onClose: () => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
};

export function ChannelAccessModal({
  channelName,
  language,
  open,
  password,
  onClose,
  onPasswordChange,
  onSubmit,
}: ChannelAccessModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <form
        className="modal-card compact-form"
        role="dialog"
        aria-modal="true"
        onSubmit={onSubmit}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid gap-2">
          <span className="inline-flex w-fit rounded-full bg-red-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-100">
            {language === 'ru' ? 'Приватный канал' : 'Locked channel'}
          </span>
          <h3 className="text-xl font-semibold text-white">{channelName}</h3>
          <p className="text-sm text-slate-500">
            {language === 'ru'
              ? 'Введите пароль один раз. Повторный ввод понадобится только после смены пароля.'
              : 'Enter the password once. You will only need it again after the password changes.'}
          </p>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-200">
            {language === 'ru' ? 'Пароль канала' : 'Channel password'}
          </span>
          <input
            className="h-12 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/10"
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder={language === 'ru' ? 'Введите пароль' : 'Enter password'}
            autoFocus
          />
        </label>

        <div className="inline-actions">
          <button className="primary-button" type="submit">
            {language === 'ru' ? 'Открыть канал' : 'Unlock channel'}
          </button>
          <button className="ghost-button" type="button" onClick={onClose}>
            {language === 'ru' ? 'Отмена' : 'Cancel'}
          </button>
        </div>
      </form>
    </div>
  );
}
