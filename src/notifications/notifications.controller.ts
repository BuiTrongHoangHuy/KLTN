import {
  Controller,
  Get,
  UseGuards,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { NotificationsService } from './notifications.service';
import { AtGuard } from 'src/auth/guards/at.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JwtPayload } from '../auth/strategies/rt.strategy';

@Controller('notifications')
@UseGuards(AtGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Get()
  findMyNotifications(
    @GetUser() user: JwtPayload,
    @Query() query: GetNotificationsDto,
  ) {
    return this.notificationsService.getNotificationsForUser(user.sub, query);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.notificationsService.markAsRead(id, user.sub);
  }
}
