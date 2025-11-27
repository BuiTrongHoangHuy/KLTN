import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Follow } from './entities/follow.entity';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from '../notifications/entities/create-notification.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow)
    private followsRepository: Repository<Follow>,
    private notificationsService: NotificationsService,
    private notificationsGateway: NotificationsGateway,
  ) { }

  async toggleFollow(followerId: number, followingId: number) {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const followId = { followerId, followingId };

    try {
      const existingFollow = await this.followsRepository.findOneBy(followId);

      if (existingFollow) {
        await this.followsRepository.remove(existingFollow);
        return { message: 'Followed', following: false };
      } else {
        const newFollow = this.followsRepository.create(followId);
        await this.followsRepository.save(newFollow);
        const notifDto: CreateNotificationDto = {
          recipientId: followingId,
          senderId: followerId,
          type: 'follow',
          targetId: followerId,
        };

        const notification =
          await this.notificationsService.createNotification(notifDto);

        if (notification) {
          this.notificationsGateway.emitNotificationToUser(
            followingId,
            notification,
          );
        }
        return { message: 'Followed', following: true };
      }
    } catch (error) {
      throw new InternalServerErrorException('Error toggling follow');
    }
  }
  async isFollowing(followerId: number, followingId: number) {
    const follow = await this.followsRepository.findOneBy({
      followerId,
      followingId,
    });
    return !!follow;
  }
}
