import type { FormEvent } from 'react';

import { UserIdentity } from '../components/app-primitives';
import type { AuthUser, DirectConversation, DirectMessage, Friend, FriendRequest } from '../types';

type FriendsStrings = {
  directMessages: string;
  friendsTab: string;
  messages: string;
  online: string;
  offline: string;
  copyId: string;
  send: string;
  dmPlaceholder: string;
  searchUsers: string;
  findPeople: string;
  addFriend: string;
  friendRequests: string;
  accept: string;
  startDialog: string;
  noFriends: string;
  friendSince: string;
  openDialog: string;
  removeFriend: string;
  unknownUser: string;
};

type FriendsViewProps = {
  i18n: FriendsStrings;
  language: 'ru' | 'en';
  selectedConversation: DirectConversation | null;
  directMessages: DirectMessage[];
  directMessageDraft: string;
  friends: Friend[];
  friendRequests: FriendRequest[];
  onlineUserIds: string[];
  userSearchQuery: string;
  userSearchResults: AuthUser[];
  onDirectDraftChange: (value: string) => void;
  onSendDirectMessage: (event: FormEvent<HTMLFormElement>) => void;
  onSearchUsers: (event: FormEvent<HTMLFormElement>) => void;
  onSearchQueryChange: (value: string) => void;
  onSendFriendRequest: (userId: string) => void;
  onAcceptFriendRequest: (requestId: string) => void;
  onOpenConversation: (userId: string) => void;
  onCopy: (value: string, label: string) => void;
  onRemoveFriend: (userId: string) => void;
};

function formatFriendConnectedDate(value: string, language: 'ru' | 'en') {
  return new Date(value).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function FriendsView({
  i18n,
  language,
  selectedConversation,
  directMessages,
  directMessageDraft,
  friends,
  friendRequests,
  onlineUserIds,
  userSearchQuery,
  userSearchResults,
  onDirectDraftChange,
  onSendDirectMessage,
  onSearchUsers,
  onSearchQueryChange,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onOpenConversation,
  onCopy,
  onRemoveFriend,
}: FriendsViewProps) {
  const activeParticipant = selectedConversation?.participant ?? null;
  const incomingRequests = friendRequests.filter((request) => request.direction === 'incoming');
  const normalizedQuery = userSearchQuery.trim().toLowerCase();

  const sortedFriends = [...friends]
    .sort((left, right) => {
      const leftOnline = onlineUserIds.includes(left.id) ? 1 : 0;
      const rightOnline = onlineUserIds.includes(right.id) ? 1 : 0;
      if (leftOnline !== rightOnline) {
        return rightOnline - leftOnline;
      }

      return new Date(right.connectedAt).getTime() - new Date(left.connectedAt).getTime();
    })
    .filter((friend) => {
      if (!normalizedQuery) {
        return true;
      }

      return (
        friend.displayName.toLowerCase().includes(normalizedQuery) ||
        friend.username.toLowerCase().includes(normalizedQuery)
      );
    });

  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="space-y-4 rounded-[26px] border border-white/6 bg-[#171a1d] p-4 shadow-[0_20px_48px_rgba(0,0,0,0.22)]">
        <div className="rounded-[22px] border border-white/6 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">{i18n.friendsTab}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {onlineUserIds.filter((userId) => friends.some((friend) => friend.id === userId)).length} {i18n.online}
              </p>
            </div>
            <span className="inline-flex rounded-full bg-emerald-400/12 px-3 py-1 text-xs font-semibold text-emerald-100">
              {friends.length}
            </span>
          </div>

          <form className="mt-4 grid gap-3" onSubmit={onSearchUsers}>
            <input
              className="h-11 rounded-2xl border border-white/6 bg-[#121417] px-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400/40 focus:ring-4 focus:ring-emerald-400/10"
              value={userSearchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder={i18n.searchUsers}
            />
            <button className="h-10 rounded-2xl border border-white/6 bg-white/[0.03] px-4 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]" type="submit">
              {i18n.findPeople}
            </button>
          </form>
        </div>

        {userSearchResults.length > 0 ? (
          <div className="rounded-[22px] border border-white/6 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {language === 'ru' ? 'Найденные пользователи' : 'People found'}
              </h4>
              <span className="text-xs text-slate-500">{userSearchResults.length}</span>
            </div>
            <div className="grid gap-2.5">
              {userSearchResults.slice(0, 4).map((result) => (
                <div key={result.id} className="rounded-[18px] border border-white/6 bg-[#121417] p-3.5">
                  <UserIdentity
                    displayName={result.displayName}
                    username={result.username}
                    avatarUrl={result.avatarUrl}
                    subtitle={`@${result.username}`}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="rounded-2xl bg-emerald-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
                      type="button"
                      onClick={() => onSendFriendRequest(result.id)}
                    >
                      {i18n.addFriend}
                    </button>
                    <button
                      className="rounded-2xl border border-white/6 bg-white/[0.03] px-3.5 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
                      type="button"
                      onClick={() => onOpenConversation(result.id)}
                    >
                      {i18n.startDialog}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-[22px] border border-white/6 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{i18n.friendRequests}</h4>
            <span className="inline-flex rounded-full bg-white/6 px-2.5 py-1 text-[11px] font-medium text-slate-300">
              {incomingRequests.length}
            </span>
          </div>
          {incomingRequests.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-white/8 bg-[#121417] p-3 text-sm text-slate-500">
              {language === 'ru' ? 'Пока нет новых заявок.' : 'No new requests yet.'}
            </div>
          ) : (
            <div className="grid gap-2.5">
              {incomingRequests.slice(0, 4).map((request) => (
                <div key={request.id} className="rounded-[18px] border border-white/6 bg-[#121417] p-3.5">
                  <UserIdentity
                    displayName={request.requester.displayName}
                    username={request.requester.username}
                    avatarUrl={request.requester.avatarUrl}
                    subtitle={`@${request.requester.username}`}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="rounded-2xl bg-emerald-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
                      type="button"
                      onClick={() => onAcceptFriendRequest(request.id)}
                    >
                      {i18n.accept}
                    </button>
                    <button
                      className="rounded-2xl border border-white/6 bg-white/[0.03] px-3.5 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
                      type="button"
                      onClick={() => onCopy(request.requester.id, i18n.copyId)}
                    >
                      {i18n.copyId}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[22px] border border-white/6 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{i18n.directMessages}</h4>
            <span className="text-xs text-slate-500">{sortedFriends.length}</span>
          </div>
          <div className="grid max-h-[48vh] gap-2.5 overflow-y-auto pr-1">
            {sortedFriends.length === 0 ? <span className="text-sm text-slate-500">{i18n.noFriends}</span> : null}
            {sortedFriends.map((friend) => {
              const isOnline = onlineUserIds.includes(friend.id);
              const isActive = activeParticipant?.id === friend.id;

              return (
                <button
                  key={friend.id}
                  className={
                    isActive
                      ? 'rounded-[18px] border border-emerald-300/16 bg-emerald-400/10 p-3.5 text-left'
                      : 'rounded-[18px] border border-white/6 bg-[#121417] p-3.5 text-left transition hover:bg-white/[0.05]'
                  }
                  type="button"
                  onClick={() => onOpenConversation(friend.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <UserIdentity
                      displayName={friend.displayName}
                      username={friend.username}
                      avatarUrl={friend.avatarUrl}
                      subtitle={`@${friend.username}`}
                    />
                    <span
                      className={
                        isOnline
                          ? 'inline-flex rounded-full bg-emerald-400/12 px-2.5 py-1 text-[11px] font-medium text-emerald-100'
                          : 'inline-flex rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-400'
                      }
                    >
                      {isOnline ? i18n.online : i18n.offline}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      {i18n.friendSince} {formatFriendConnectedDate(friend.connectedAt, language)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/[0.06]"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onCopy(friend.id, i18n.copyId);
                        }}
                      >
                        {i18n.copyId}
                      </button>
                      <button
                        className="rounded-2xl border border-red-400/16 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/15"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRemoveFriend(friend.id);
                        }}
                      >
                        {i18n.removeFriend}
                      </button>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

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
                      onlineUserIds.includes(activeParticipant.id)
                        ? 'inline-flex rounded-full bg-emerald-400/12 px-3 py-1 text-xs font-medium text-emerald-100'
                        : 'inline-flex rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-400'
                    }
                  >
                    {onlineUserIds.includes(activeParticipant.id) ? i18n.online : i18n.offline}
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
    </section>
  );
}
