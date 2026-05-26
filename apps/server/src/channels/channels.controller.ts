import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccessChannelDto } from './dto/access-channel.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { ChannelsService } from './channels.service';

@UseGuards(JwtAuthGuard)
@Controller('servers/:serverId/channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  list(@Param('serverId') serverId: string, @CurrentUser() user: { sub: string }) {
    return this.channelsService.listForServer(serverId, user.sub);
  }

  @Post()
  create(
    @Param('serverId') serverId: string,
    @Body() dto: CreateChannelDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.channelsService.create(serverId, dto, user.sub);
  }

  @Delete(':channelId')
  remove(
    @Param('serverId') serverId: string,
    @Param('channelId') channelId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.channelsService.remove(serverId, channelId, user.sub);
  }

  @Patch(':channelId')
  update(
    @Param('serverId') serverId: string,
    @Param('channelId') channelId: string,
    @Body() dto: UpdateChannelDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.channelsService.update(serverId, channelId, dto, user.sub);
  }

  @Post(':channelId/access')
  access(
    @Param('serverId') serverId: string,
    @Param('channelId') channelId: string,
    @Body() dto: AccessChannelDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.channelsService.access(serverId, channelId, dto, user.sub);
  }

  @Get(':channelId/messages')
  listMessages(
    @Param('serverId') serverId: string,
    @Param('channelId') channelId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.channelsService.listMessages(serverId, channelId, user.sub);
  }

  @Post(':channelId/messages')
  sendMessage(
    @Param('serverId') serverId: string,
    @Param('channelId') channelId: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.channelsService.sendMessage(serverId, channelId, dto, user.sub);
  }
}
