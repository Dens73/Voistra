import { ServerMemberEntity } from './server-member.entity';

export function isActiveRestriction(value?: Date | null) {
  return Boolean(value && new Date(value).getTime() > Date.now());
}

export function serializeModeration(member: ServerMemberEntity) {
  return {
    bannedUntil: member.bannedUntil,
    mutedUntil: member.mutedUntil,
    deafenedUntil: member.deafenedUntil,
    screenShareBlockedUntil: member.screenShareBlockedUntil,
    isBanned: isActiveRestriction(member.bannedUntil),
    isMuted: isActiveRestriction(member.mutedUntil),
    isDeafened: isActiveRestriction(member.deafenedUntil),
    isScreenShareBlocked: isActiveRestriction(member.screenShareBlockedUntil),
  };
}

export function sortServerMembers(left: ServerMemberEntity, right: ServerMemberEntity) {
  if (left.role === right.role) {
    return left.createdAt.getTime() - right.createdAt.getTime();
  }

  if (left.role === 'owner') {
    return -1;
  }

  if (right.role === 'owner') {
    return 1;
  }

  if (left.role === 'admin') {
    return -1;
  }

  if (right.role === 'admin') {
    return 1;
  }

  return left.createdAt.getTime() - right.createdAt.getTime();
}

export function serializeServerMember(member: ServerMemberEntity, ownerId: string) {
  return {
    id: member.id,
    userId: member.userId,
    role: member.role,
    joinedAt: member.createdAt,
    user: member.user
      ? {
          id: member.user.id,
          username: member.user.username,
          displayName: member.user.displayName,
        }
      : null,
    isOwner: member.userId === ownerId,
    moderation: serializeModeration(member),
  };
}
