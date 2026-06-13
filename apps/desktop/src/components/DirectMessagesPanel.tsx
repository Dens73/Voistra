import type { FormEvent } from 'react';

import { UserIdentity } from './app-primitives';
import type { DirectConversation, DirectMessage } from '../types';

type DirectMessagesPanelStrings = {
  copyId: string;
  directMessages: string;
  dmPlaceholder: string;
  offline: string;
  online: string;
  send: string;
  unknownUser: string;
};

type DirectMessagesPanelProps = {
  activeParticipantOnline: boolean;
  directMessageDraft: string;
  directMessages: DirectMessage[];
  i18n: DirectMessagesPanelStrings;
  language: 'ru' | 'en';
  selectedConversation: DirectConversation | null;
  onCopy: (value: string, label: string) => void;
  onDirectDraftChange: (value: string) => void;
  onSendDirectMessage: (event: FormEvent<HTMLFormElement>) => void;
};

export function DirectMessagesPanel({
  activeParticipantOnline,
  directMessageDraft,
  directMessages,
  i18n,
  language,
  selectedConversation,
  onCopy,
  onDirectDraftChange,
  onSendDirectMessage,
}: DirectMessagesPanelProps) {
  const activeParticipant = selectedConversation?.participant ?? null;

  return (
    <section className="rounded-[26px] border border-white/6 bg-[#171a1d] p-4 shadow-[0_20px_48px_rgba(0,0,0,0.22)]">
      {activeParticipant ? (
        <div className="flex h-full flex-col">
          <div className="rounded-[22px] border border-white/6 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <UserIdentity
                displayName={activeParticipant.displayName}
                username={activeParticipant.username}
                avatarUrl={activeParticipant.avatarUrl}
                subtitle={`@${activeParticipant.username}`}
              />
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    activeParticipantOnline
                      ? 'inline-flex rounded-full bg-emerald-400/12 px-3 py-1 text-xs font-medium text-emerald-100'
                      : 'inline-flex rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-400'
                  }
                >
                  {activeParticipantOnline ? i18n.online : i18n.offline}
                </span>
                <button
                  className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
                  type="button"
                  onClick={() => onCopy(activeParticipant.id, i18n.copyId)}
                >
                  {i18n.copyId}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex-1 overflow-hidden rounded-[22px] border border-white/6 bg-[#121417]">
            <div className="flex h-full flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {directMessages.map((message) => (
                  <div key={message.id} className="rounded-[18px] border border-white/6 bg-white/[0.03] p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <strong className="text-sm font-medium text-white">{message.author?.displayName ?? i18n.unknownUser}</strong>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{message.content}</p>
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(message.createdAt).toLocaleTimeString(language === 'ru' ? 'ru-RU' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <form className="border-t border-white/6 p-4" onSubmit={onSendDirectMessage}>
                <div className="flex gap-3">
                  <input
                    className="h-12 flex-1 rounded-2xl border border-white/6 bg-white/[0.03] px-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/10"
                    value={directMessageDraft}
                    onChange={(event) => onDirectDraftChange(event.target.value)}
                    placeholder={i18n.dmPlaceholder}
                  />
                  <button className="h-12 rounded-2xl bg-emerald-500 px-5 text-sm font-semibold text-white transition hover:bg-emerald-400" type="submit">
                    {i18n.send}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full min-h-[420px] items-center justify-center rounded-[22px] border border-dashed border-white/8 bg-white/[0.02]">
          <div className="max-w-sm text-center">
            <h3 className="text-lg font-semibold text-white">{i18n.directMessages}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {language === 'ru'
                ? 'Выбери друга слева, чтобы открыть личную переписку.'
                : 'Choose a friend on the left to open a direct conversation.'}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
