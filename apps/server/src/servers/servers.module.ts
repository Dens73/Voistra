import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditModule } from '../audit/audit.module';
import { UserEntity } from '../users/user.entity';
import { ServerMemberEntity } from './server-member.entity';
import { ServerEntity } from './server.entity';
import { ServersController } from './servers.controller';
import { ServersService } from './servers.service';

@Module({
  imports: [TypeOrmModule.forFeature([ServerEntity, ServerMemberEntity, UserEntity]), AuditModule],
  controllers: [ServersController],
  providers: [ServersService],
  exports: [ServersService, TypeOrmModule],
})
export class ServersModule {}
