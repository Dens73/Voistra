import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateServerDto } from './dto/create-server.dto';
import { ServersService } from './servers.service';

@UseGuards(JwtAuthGuard)
@Controller('servers')
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Get()
  list(@CurrentUser() user: { sub: string }) {
    return this.serversService.listForUser(user.sub);
  }

  @Post()
  create(@Body() dto: CreateServerDto, @CurrentUser() user: { sub: string }) {
    return this.serversService.create(dto, user.sub);
  }

  @Post(':serverId/join')
  join(@Param('serverId') serverId: string, @CurrentUser() user: { sub: string }) {
    return this.serversService.join(serverId, user.sub);
  }

  @Patch(':serverId')
  update(
    @Param('serverId') serverId: string,
    @Body() dto: { name?: string; description?: string | null },
    @CurrentUser() user: { sub: string },
  ) {
    return this.serversService.update(serverId, dto, user.sub);
  }

  @Get(':serverId')
  getOne(@Param('serverId') serverId: string, @CurrentUser() user: { sub: string }) {
    return this.serversService.findOneForUser(serverId, user.sub);
  }

  @Get(':serverId/members')
  listMembers(@Param('serverId') serverId: string, @CurrentUser() user: { sub: string }) {
    return this.serversService.listMembers(serverId, user.sub);
  }

  @Delete(':serverId/members/:memberUserId')
  removeMember(
    @Param('serverId') serverId: string,
    @Param('memberUserId') memberUserId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.serversService.removeMember(serverId, memberUserId, user.sub);
  }

  @Patch(':serverId/members/:memberUserId/moderation')
  moderateMember(
    @Param('serverId') serverId: string,
    @Param('memberUserId') memberUserId: string,
    @Body()
    dto: {
      action:
        | 'mute'
        | 'deafen'
        | 'block_share'
        | 'ban'
        | 'clear_mute'
        | 'clear_deafen'
        | 'clear_block_share'
        | 'clear_ban';
      durationMinutes?: number;
    },
    @CurrentUser() user: { sub: string },
  ) {
    return this.serversService.moderateMember(serverId, memberUserId, dto, user.sub);
  }
}
