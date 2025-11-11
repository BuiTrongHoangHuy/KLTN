import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from './entities/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<Notification | null> {
    if (dto.recipientId === dto.senderId) {
      return null;
    }

    try {
      const newNotification = this.notificationsRepository.create(dto);
      const savedNotification =
        await this.notificationsRepository.save(newNotification);

      return savedNotification;
    } catch (error) {
      throw new InternalServerErrorException('Error creating notification');
    }
  }
}
