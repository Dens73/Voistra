import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { RedisService } from './infrastructure/redis.service';

@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  @Get('health')
  async health() {
    const redis = await this.redisService.ping();

    return {
      name: 'diploma-voip-server',
      status: 'ok',
      timestamp: new Date().toISOString(),
      port: Number(this.configService.get<string>('PORT', '3000')),
      redis,
      turn: {
        url: this.configService.get<string>('TURN_URL', 'turn:localhost:3478'),
        username: this.configService.get<string>('TURN_USERNAME', 'demo'),
      },
    };
  }
}
