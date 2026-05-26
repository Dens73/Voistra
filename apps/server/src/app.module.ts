import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ChannelsModule } from './channels/channels.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ServersModule } from './servers/servers.module';
import { SocialModule } from './social/social.module';
import { UserEntity } from './users/user.entity';
import { UsersModule } from './users/users.module';
import { AuditLogEntity } from './audit/audit-log.entity';
import { ChannelEntity } from './channels/channel.entity';
import { ServerEntity } from './servers/server.entity';
import { ServerMemberEntity } from './servers/server-member.entity';
import { TextMessageEntity } from './channels/text-message.entity';
import { FriendRequestEntity } from './social/friend-request.entity';
import { DirectConversationEntity } from './social/direct-conversation.entity';
import { DirectMessageEntity } from './social/direct-message.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/server/.env', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const entities = [
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

        if (configService.get<string>('DB_TYPE') === 'sqljs') {
          return {
            type: 'sqljs' as const,
            location: configService.get<string>('DB_FILE', 'diploma-voip.sqlite'),
            autoSave: true,
            autoLoadEntities: true,
            synchronize: true,
            entities,
          };
        }

        return {
          type: 'postgres' as const,
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: Number(configService.get<string>('DB_PORT', '5432')),
          username: configService.get<string>('DB_USER', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_NAME', 'diploma_voip'),
          autoLoadEntities: true,
          synchronize: true,
          entities,
        };
      },
    }),
    InfrastructureModule,
    UsersModule,
    AuthModule,
    ServersModule,
    ChannelsModule,
    SocialModule,
    RealtimeModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
