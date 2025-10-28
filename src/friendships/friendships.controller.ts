import {
  Controller,
  Post,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { AtGuard } from 'src/auth/guards/at.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JwtPayload } from 'src/auth/strategies/rt.strategy';

@Controller('friendships')
@UseGuards(AtGuard)
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

  @Post(':userId/accept')
  @HttpCode(HttpStatus.OK)
  acceptRequest(
    @Param('userId', ParseIntPipe) senderId: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.friendshipsService.acceptFriendRequest(user.sub, senderId);
  }

  @Delete(':userId/reject')
  @HttpCode(HttpStatus.OK)
  rejectRequest(
    @Param('userId', ParseIntPipe) senderId: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.friendshipsService.rejectFriendRequest(user.sub, senderId);
  }

  @Delete(':userId/cancel')
  @HttpCode(HttpStatus.OK)
  cancelRequest(
    @Param('userId', ParseIntPipe) receiverId: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.friendshipsService.cancelFriendRequest(user.sub, receiverId);
  }
}
