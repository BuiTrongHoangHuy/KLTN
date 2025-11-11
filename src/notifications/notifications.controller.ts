import {
  Controller,
  Get,
  UseGuards,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AtGuard } from 'src/auth/guards/at.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JwtPayload } from '../auth/strategies/rt.strategy';

@Controller('notifications')
@UseGuards(AtGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findMyNotifications(@GetUser() user: JwtPayload) {
    return this.notificationsService.getNotificationsForUser(user.sub);
  }
}
