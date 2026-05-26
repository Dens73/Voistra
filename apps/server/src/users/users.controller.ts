import { Controller, Get, Patch, Query, UseGuards, Body } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  search(@Query('q') query: string, @CurrentUser() user: { sub: string }) {
    return this.usersService.search(query ?? '', user.sub);
  }

  @Patch('me')
  updateProfile(@Body() dto: UpdateProfileDto, @CurrentUser() user: { sub: string }) {
    return this.usersService.updateProfile(user.sub, dto);
  }
}
