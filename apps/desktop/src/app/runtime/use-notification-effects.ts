import { useEffect, useRef } from 'react';

import type { DirectConversation, Friend, FriendRequest, ServerMember, VoiceParticipant } from '../../types';
import type { ConnectedVoiceSession } from '../types';

type Copy = {
  unknownUser: string;
};

type Params = {
  connectedVoiceSession: ConnectedVoiceSession | null;
  conversations: DirectConversation[];
  currentServerMember: ServerMember | null;
  friendRequests: FriendRequest[];
  friends: Friend[];
  i18n: Copy;
  language: 'ru' | 'en';
  participants: VoiceParticipant[];
  peerLabel: (userId: string) => string;
  pushNotification: (title: string, body: string, tone?: 'soft' | 'alert') => void;
  userId?: string;
};

export function useNotificationEffects({
  connectedVoiceSession,
  conversations,
  currentServerMember,
  friendRequests,
  friends,
  i18n,
  language,
  participants,
  peerLabel,
  pushNotification,
  userId,
}: Params) {
  const previousIncomingRequestCountRef = useRef<number>(0);
  const previousFriendIdsRef = useRef<string[]>([]);
  const previousVoiceParticipantIdsRef = useRef<string[]>([]);
  const previousModerationSnapshotRef = useRef<string>('');

  useEffect(() => {
    const incomingCount = friendRequests.filter((request) => request.direction === 'incoming').length;
    if (previousIncomingRequestCountRef.current && incomingCount > previousIncomingRequestCountRef.current) {
      pushNotification(
        language === 'ru' ? 'Новая заявка в друзья' : 'New friend request',
        language === 'ru' ? `Входящих заявок: ${incomingCount}` : `Incoming requests: ${incomingCount}`,
        'alert',
      );
    }
    previousIncomingRequestCountRef.current = incomingCount;
  }, [friendRequests, language, pushNotification]);

  useEffect(() => {
    const nextFriendIds = friends.map((friend) => friend.id);
    const previousFriendIds = previousFriendIdsRef.current;
    if (previousFriendIds.length > 0) {
      const newFriend = friends.find((friend) => !previousFriendIds.includes(friend.id));
      if (newFriend) {
        pushNotification(
          language === 'ru' ? 'Новый друг' : 'New friend',
          language === 'ru'
            ? `${newFriend.displayName ?? newFriend.username} теперь у тебя в друзьях`
            : `${newFriend.displayName ?? newFriend.username} is now on your friends list`,
          'soft',
        );
      }
    }
    previousFriendIdsRef.current = nextFriendIds;
  }, [friends, language, pushNotification]);

  useEffect(() => {
    if (!connectedVoiceSession) {
      previousVoiceParticipantIdsRef.current = [];
      return;
    }

    const otherParticipantIds = participants
      .map((participant) => participant.userId)
      .filter((participantUserId) => participantUserId !== userId);
    const previous = previousVoiceParticipantIdsRef.current;

    if (previous.length > 0 || otherParticipantIds.length > 0) {
      const joined = otherParticipantIds.filter((participantUserId) => !previous.includes(participantUserId));
      const left = previous.filter((participantUserId) => !otherParticipantIds.includes(participantUserId));

      for (const participantUserId of joined) {
        pushNotification(
          language === 'ru' ? 'Участник вошёл в голосовой канал' : 'Participant joined voice',
          peerLabel(participantUserId),
          'soft',
        );
      }

      for (const participantUserId of left) {
        pushNotification(
          language === 'ru' ? 'Участник вышел из голосового канала' : 'Participant left voice',
          peerLabel(participantUserId),
          'soft',
        );
      }
    }

    previousVoiceParticipantIdsRef.current = otherParticipantIds;
  }, [connectedVoiceSession, participants, language, peerLabel, pushNotification, userId]);

  useEffect(() => {
    const moderation = currentServerMember?.moderation;
    if (!moderation) {
      previousModerationSnapshotRef.current = '';
      return;
    }

    const snapshot = JSON.stringify({
      isBanned: moderation.isBanned,
      isMuted: moderation.isMuted,
      isDeafened: moderation.isDeafened,
      isScreenShareBlocked: moderation.isScreenShareBlocked,
    });

    if (previousModerationSnapshotRef.current) {
      const previous = JSON.parse(previousModerationSnapshotRef.current) as {
        isBanned: boolean;
        isMuted: boolean;
        isDeafened: boolean;
        isScreenShareBlocked: boolean;
      };

      if (!previous.isMuted && moderation.isMuted) {
        pushNotification(
          language === 'ru' ? 'Микрофон отключён' : 'Microphone muted',
          language === 'ru'
            ? 'Владелец или администратор сервера отключил твой микрофон.'
            : 'A server moderator muted your microphone.',
          'alert',
        );
      }
      if (!previous.isDeafened && moderation.isDeafened) {
        pushNotification(
          language === 'ru' ? 'Звук отключён' : 'Audio disabled',
          language === 'ru'
            ? 'Владелец или администратор сервера отключил тебе звук.'
            : 'A server moderator deafened you.',
          'alert',
        );
      }
      if (!previous.isScreenShareBlocked && moderation.isScreenShareBlocked) {
        pushNotification(
          language === 'ru' ? 'Демонстрация экрана запрещена' : 'Screen share blocked',
          language === 'ru'
            ? 'На этом сервере тебе временно запрещена демонстрация экрана.'
            : 'Screen sharing was temporarily disabled for you on this server.',
          'alert',
        );
      }
      if (!previous.isBanned && moderation.isBanned) {
        pushNotification(
          language === 'ru' ? 'Доступ к серверу ограничен' : 'Server access restricted',
          language === 'ru' ? 'Ты временно заблокирован на сервере.' : 'You were temporarily banned from this server.',
          'alert',
        );
      }
    }

    previousModerationSnapshotRef.current = snapshot;
  }, [currentServerMember, language, pushNotification]);
}
