import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditModule } from '../audit/audit.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { UserEntity } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { DirectConversationEntity } from './direct-conversation.entity';
import { DirectMessageEntity } from './direct-message.entity';
import { FriendRequestEntity } from './friend-request.entity';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FriendRequestEntity, DirectConversationEntity, DirectMessageEntity, UserEntity]),
    UsersModule,
    AuditModule,
    RealtimeModule,
  ],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
