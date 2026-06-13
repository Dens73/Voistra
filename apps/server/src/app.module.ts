import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ChannelsModule } from './channels/channels.module';
import { DatabaseModule } from './database/database.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ServersModule } from './servers/servers.module';
import { SocialModule } from './social/social.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/server/.env', '.env'],
    }),
    DatabaseModule,
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
