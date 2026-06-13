import { AuditLogEntity } from '../audit/audit-log.entity';
import { ChannelEntity } from '../channels/channel.entity';
import { TextMessageEntity } from '../channels/text-message.entity';
import { ServerEntity } from '../servers/server.entity';
import { ServerMemberEntity } from '../servers/server-member.entity';
import { DirectConversationEntity } from '../social/direct-conversation.entity';
import { DirectMessageEntity } from '../social/direct-message.entity';
import { FriendRequestEntity } from '../social/friend-request.entity';
import { UserEntity } from '../users/user.entity';

export const APP_ENTITIES = [
  UserEntity,
  ServerEntity,
  ServerMemberEntity,
  ChannelEntity,
  TextMessageEntity,
  AuditLogEntity,
  FriendRequestEntity,
  DirectConversationEntity,
  DirectMessageEntity,
];
