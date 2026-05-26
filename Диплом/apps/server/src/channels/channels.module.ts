import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditModule } from '../audit/audit.module';
import { ServerMemberEntity } from '../servers/server-member.entity';
import { ServerEntity } from '../servers/server.entity';
import { UserEntity } from '../users/user.entity';
import { ChannelEntity } from './channel.entity';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { TextMessageEntity } from './text-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChannelEntity, TextMessageEntity, ServerEntity, ServerMemberEntity, UserEntity]),
    AuditModule,
  ],
  controllers: [ChannelsController],
  providers: [ChannelsService],
  exports: [ChannelsService, TypeOrmModule],
})
export class ChannelsModule {}
