import type { FormEvent } from 'react';

import { DirectMessagesPanel } from '../components/DirectMessagesPanel';
import { FriendsSidebar } from '../components/FriendsSidebar';
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

  return (
    <section className="grid min-w-0 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      <FriendsSidebar
        activeParticipantId={activeParticipant?.id}
        friends={friends}
        friendRequests={friendRequests}
        i18n={i18n}
        language={language}
        onlineUserIds={onlineUserIds}
        userSearchQuery={userSearchQuery}
        userSearchResults={userSearchResults}
        onAcceptFriendRequest={onAcceptFriendRequest}
        onCopy={onCopy}
        onOpenConversation={onOpenConversation}
        onRemoveFriend={onRemoveFriend}
        onSearchQueryChange={onSearchQueryChange}
        onSearchUsers={onSearchUsers}
        onSendFriendRequest={onSendFriendRequest}
      />

      <DirectMessagesPanel
        activeParticipantOnline={activeParticipant ? onlineUserIds.includes(activeParticipant.id) : false}
        directMessageDraft={directMessageDraft}
        directMessages={directMessages}
        i18n={i18n}
        language={language}
        selectedConversation={selectedConversation}
        onCopy={onCopy}
        onDirectDraftChange={onDirectDraftChange}
        onSendDirectMessage={onSendDirectMessage}
      />
    </section>
  );
}
