import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendDirectMessageDto } from './dto/send-direct-message.dto';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { SocialService } from './social.service';

@UseGuards(JwtAuthGuard)
@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('friends')
  listFriends(@CurrentUser() user: { sub: string }) {
    return this.socialService.listFriends(user.sub);
  }

  @Get('requests')
  listPending(@CurrentUser() user: { sub: string }) {
    return this.socialService.listPending(user.sub);
  }

  @Post('requests')
  sendFriendRequest(@Body() dto: SendFriendRequestDto, @CurrentUser() user: { sub: string }) {
    return this.socialService.sendFriendRequest(user.sub, dto);
  }

  @Post('requests/:requestId/accept')
  acceptFriendRequest(@Param('requestId') requestId: string, @CurrentUser() user: { sub: string }) {
    return this.socialService.acceptFriendRequest(requestId, user.sub);
  }

  @Delete('friends/:friendUserId')
  removeFriend(@Param('friendUserId') friendUserId: string, @CurrentUser() user: { sub: string }) {
    return this.socialService.removeFriend(user.sub, friendUserId);
  }

  @Get('conversations')
  listConversations(@CurrentUser() user: { sub: string }) {
    return this.socialService.listConversations(user.sub);
  }

  @Post('conversations/by-user/:otherUserId')
  ensureConversation(@Param('otherUserId') otherUserId: string, @CurrentUser() user: { sub: string }) {
    return this.socialService.ensureConversation(user.sub, otherUserId);
  }

  @Get('conversations/:conversationId/messages')
  listMessages(@Param('conversationId') conversationId: string, @CurrentUser() user: { sub: string }) {
    return this.socialService.listMessages(conversationId, user.sub);
  }

  @Post('conversations/:conversationId/messages')
  sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendDirectMessageDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.socialService.sendMessage(conversationId, dto, user.sub);
  }
}
