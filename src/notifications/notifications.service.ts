import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { Repository } from 'typeorm';
import { CreateNotificationDto } from './entities/create-notification.dto';
import { GetNotificationsDto } from './dto/get-notifications.dto';

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

  async getNotificationsForUser(
    userId: number,
    query: GetNotificationsDto,
  ): Promise<{ data: Notification[]; nextCursor: string | null }> {
    const { cursor, limit = 20 } = query;

    const queryBuilder = this.notificationsRepository
      .createQueryBuilder('notification')
      .leftJoin('notification.sender', 'sender')
      .select([
        'notification.notificationId',
        'notification.type',
        'notification.targetId',
        'notification.isRead',
        'notification.createdAt',
        'sender.userId',
        'sender.username',
        'sender.fullName',
        'sender.avatarUrl',
      ])
      .where('notification.recipientId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .addOrderBy('notification.notificationId', 'DESC')
      .take(limit + 1);

    if (cursor) {
      try {
        const decodedCursor = Buffer.from(cursor, 'base64').toString('ascii');
        const [lastCreatedAtStr, lastIdStr] = decodedCursor.split(',');
        const lastCreatedAt = new Date(lastCreatedAtStr);
        const lastId = parseInt(lastIdStr, 10);

        if (!isNaN(lastCreatedAt.getTime()) && !isNaN(lastId)) {
          queryBuilder.andWhere(
            '(notification.createdAt < :lastCreatedAt OR (notification.createdAt = :lastCreatedAt AND notification.notificationId < :lastId))',
            { lastCreatedAt, lastId },
          );
        }
      } catch (error) {
        throw new InternalServerErrorException('Invalid cursor');
      }
    }

    const notifications = await queryBuilder.getMany();
    let nextCursor: string | null = null;

    if (notifications.length > limit) {
      const nextItem = notifications.pop();
      const lastItem = notifications[notifications.length - 1];
      if (lastItem) {
        const cursorString = `${lastItem.createdAt.toISOString()},${lastItem.notificationId}`;
        nextCursor = Buffer.from(cursorString).toString('base64');
      }
    }

    return {
      data: notifications,
      nextCursor,
    };
  }

  async markAsRead(notificationId: number, userId: number) {
    const notification = await this.notificationsRepository.findOne({
      where: { notificationId },
    });

    if (!notification) {
      throw new InternalServerErrorException('Notification not found');
    }

    if (notification.recipientId !== userId) {
      throw new InternalServerErrorException(
        'You are not allowed to mark this notification as read',
      );
    }

    notification.isRead = true;
    return this.notificationsRepository.save(notification);
  }
}
