import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditModule } from '../audit/audit.module';
import { ChannelEntity } from '../channels/channel.entity';
import { ServerMemberEntity } from '../servers/server-member.entity';
import { RealtimeEventsService } from './realtime-events.service';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [JwtModule.register({}), AuditModule, TypeOrmModule.forFeature([ChannelEntity, ServerMemberEntity])],
  providers: [RealtimeEventsService, RealtimeGateway],
  exports: [RealtimeEventsService],
})
export class RealtimeModule {}
