import type { FormEvent, ReactNode } from 'react';

import type { Message } from '../types';

type TextChannelStrings = {
  textChat: string;
  messages: string;
  unknownUser: string;
  typeMessage: string;
  send: string;
};

type TextChannelViewProps = {
  i18n: TextChannelStrings;
  messages: Message[];
  messageDraft: string;
  onMessageDraftChange: (value: string) => void;
  onSendMessage: (event: FormEvent<HTMLFormElement>) => void;
  renderSidePanel?: ReactNode;
};

export function TextChannelView({
  i18n,
  messages,
  messageDraft,
  onMessageDraftChange,
  onSendMessage,
  renderSidePanel,
}: TextChannelViewProps) {
  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="rounded-[24px] border border-white/6 bg-[#171a1d] p-4 shadow-[0_20px_48px_rgba(0,0,0,0.22)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">{i18n.textChat}</h3>
            <p className="text-sm text-slate-500">{messages.length} {i18n.messages}</p>
          </div>
        </div>

        <div className="grid max-h-[58vh] gap-2.5 overflow-y-auto pr-1">
          {messages.map((message) => (
            <article key={message.id} className="rounded-[20px] border border-white/6 bg-white/[0.03] p-3.5">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                <strong className="text-sm font-medium text-white">{message.author?.displayName ?? i18n.unknownUser}</strong>
                <span>{new Date(message.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm leading-5 text-slate-300">{message.content}</p>
            </article>
          ))}
        </div>

        <form className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={onSendMessage}>
          <input
            className="h-12 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/10"
            value={messageDraft}
            onChange={(event) => onMessageDraftChange(event.target.value)}
            placeholder={i18n.typeMessage}
          />
          <button className="h-12 rounded-2xl bg-emerald-500 px-5 text-sm font-semibold text-white transition hover:bg-emerald-400" type="submit">
            {i18n.send}
          </button>
        </form>
      </div>

      {renderSidePanel}
    </section>
  );
}
