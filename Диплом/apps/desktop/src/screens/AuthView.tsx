import type { FormEvent } from 'react';

import type { AuthMode, Language } from '../app/types';
import { LogoMark } from '../components/app-primitives';

type AuthFormState = {
  username: string;
  displayName: string;
  password: string;
};

type AuthStrings = {
  authHeadline: string;
  authBody: string;
  login: string;
  register: string;
  username: string;
  displayName: string;
  password: string;
  createAccount: string;
  signIn: string;
};

type AuthViewProps = {
  authMode: AuthMode;
  authForm: AuthFormState;
  error: string;
  language: Language;
  i18n: AuthStrings;
  onAuthModeChange: (mode: AuthMode) => void;
  onAuthFormChange: (updater: (current: AuthFormState) => AuthFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function AuthView({
  authMode,
  authForm,
  error,
  language,
  i18n,
  onAuthModeChange,
  onAuthFormChange,
  onSubmit,
}: AuthViewProps) {
  return (
    <div className="min-h-screen bg-[#0f1113] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/6 bg-[#171a1d] shadow-[0_32px_80px_rgba(0,0,0,0.35)] lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden bg-[radial-gradient(circle_at_top_left,rgba(99,195,180,0.14),transparent_34%),linear-gradient(180deg,#171a1d_0%,#111315_100%)] p-10 lg:flex lg:flex-col lg:justify-between">
            <div className="space-y-5">
              <div className="inline-flex rounded-full border border-emerald-300/12 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
                Voistra
              </div>
              <div className="space-y-3">
                <LogoMark />
                <h1 className="text-5xl font-semibold tracking-[-0.06em] text-white">{i18n.authHeadline}</h1>
                <p className="max-w-sm text-sm leading-6 text-slate-400">{i18n.authBody}</p>
              </div>
            </div>
            <div className="grid gap-3 text-sm text-slate-500">
              <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
                {language === 'ru' ? 'Голос, каналы и личные сообщения в одном рабочем пространстве.' : 'Voice, channels, and direct messages in one workspace.'}
              </div>
            </div>
          </section>

          <section className="flex items-center p-6 sm:p-10">
            <div className="mx-auto w-full max-w-md space-y-6">
              <div className="space-y-3 lg:hidden">
                <div className="inline-flex rounded-full border border-emerald-300/12 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/80">
                  Voistra
                </div>
                <h1 className="text-4xl font-semibold tracking-[-0.06em] text-white">{i18n.authHeadline}</h1>
                <p className="text-sm text-slate-400">{i18n.authBody}</p>
              </div>

              <div className="inline-flex rounded-2xl border border-white/6 bg-[#121417] p-1">
                <button
                  className={authMode === 'login'
                    ? 'rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white'
                    : 'rounded-xl px-4 py-2 text-sm font-medium text-slate-400 transition hover:text-white'}
                  type="button"
                  onClick={() => onAuthModeChange('login')}
                >
                  {i18n.login}
                </button>
                <button
                  className={authMode === 'register'
                    ? 'rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white'
                    : 'rounded-xl px-4 py-2 text-sm font-medium text-slate-400 transition hover:text-white'}
                  type="button"
                  onClick={() => onAuthModeChange('register')}
                >
                  {i18n.register}
                </button>
              </div>

              <form className="space-y-4 rounded-[24px] border border-white/6 bg-[#1b1f24] p-5" onSubmit={onSubmit}>
                <label className="grid gap-2 text-sm font-medium text-slate-200">
                  <span>{i18n.username}</span>
                  <input
                    className="h-12 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/10"
                    value={authForm.username}
                    onChange={(event) => onAuthFormChange((current) => ({ ...current, username: event.target.value }))}
                    placeholder={language === 'ru' ? 'Введите логин' : 'Enter username'}
                    required
                  />
                </label>

                {authMode === 'register' ? (
                  <label className="grid gap-2 text-sm font-medium text-slate-200">
                    <span>{i18n.displayName}</span>
                    <input
                      className="h-12 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/10"
                      value={authForm.displayName}
                      onChange={(event) => onAuthFormChange((current) => ({ ...current, displayName: event.target.value }))}
                      placeholder={language === 'ru' ? 'Как тебя видеть в Voistra' : 'How you appear in Voistra'}
                      required
                    />
                  </label>
                ) : null}

                <label className="grid gap-2 text-sm font-medium text-slate-200">
                  <span>{i18n.password}</span>
                  <input
                    className="h-12 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/10"
                    type="password"
                    value={authForm.password}
                    onChange={(event) => onAuthFormChange((current) => ({ ...current, password: event.target.value }))}
                    placeholder={language === 'ru' ? 'Введите пароль' : 'Enter password'}
                    required
                  />
                </label>

                <button className="h-12 w-full rounded-2xl bg-emerald-500 text-sm font-semibold text-white transition hover:bg-emerald-400" type="submit">
                  {authMode === 'register' ? i18n.createAccount : i18n.signIn}
                </button>
              </form>

              {error ? (
                <div className="rounded-2xl border border-red-400/18 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
