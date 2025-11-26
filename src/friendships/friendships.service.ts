import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  BadRequestException, NotFoundException, UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Friendship } from './entities/friendship.entity';
import { Repository } from 'typeorm';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateNotificationDto } from '../notifications/entities/create-notification.dto';

@Injectable()
export class FriendshipsService {
  constructor(
    @InjectRepository(Friendship)
    private friendshipsRepository: Repository<Friendship>,
    private notificationsService: NotificationsService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async sendFriendRequest(senderId: number, receiverId: number) {
    if (senderId === receiverId) {
      throw new BadRequestException(
        'You cannot send a friend request to yourself',
      );
    }

    const userOneId = Math.min(senderId, receiverId);
    const userTwoId = Math.max(senderId, receiverId);

    try {
      const existingRelationship = await this.friendshipsRepository.findOneBy({
        userOneId,
        userTwoId,
      });

      if (existingRelationship) {
        if (existingRelationship.status === 'accepted') {
          throw new ConflictException('You are already friends');
        }
        if (existingRelationship.status === 'pending') {
          throw new ConflictException('Friend request is already pending');
        }
      }

      const newRequest = this.friendshipsRepository.create({
        userOneId,
        userTwoId,
        status: 'pending',
        actionUserId: senderId,
      });

      await this.friendshipsRepository.save(newRequest);
      const notifDto: CreateNotificationDto = {
        recipientId: receiverId,
        senderId: senderId,
        type: 'friend_request',
        targetId: senderId,
      };

      const notification =
        await this.notificationsService.createNotification(notifDto);

      if (notification) {
        this.notificationsGateway.emitNotificationToUser(
          receiverId,
          notification,
        );
      }
      return { message: 'Sent friend request' };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Could not send friend request');
    }
  }

  private async getRelationship(userId1: number, userId2: number) {
    const userOneId = Math.min(userId1, userId2);
    const userTwoId = Math.max(userId1, userId2);
    return this.friendshipsRepository.findOneBy({ userOneId, userTwoId });
  }

  async acceptFriendRequest(receiverId: number, senderId: number) {
    const relationship = await this.getRelationship(receiverId, senderId);

    if (!relationship) {
      throw new NotFoundException('Not found friend request');
    }

    if (relationship.status !== 'pending') {
      throw new ConflictException('Cannot accept this friend request');
    }

    if (relationship.actionUserId === receiverId) {
      throw new UnauthorizedException(
        'You are not the receiver of this friend request',
      );
    }

    try {
      relationship.status = 'accepted';
      relationship.actionUserId = receiverId;
      await this.friendshipsRepository.save(relationship);
      return { message: 'Accepted Request' };
    } catch (error) {
      throw new InternalServerErrorException('Could not accept friend request');
    }
  }

  async rejectFriendRequest(receiverId: number, senderId: number) {
    const relationship = await this.getRelationship(receiverId, senderId);

    if (!relationship) {
      throw new NotFoundException('Not found friend request');
    }

    if (relationship.status !== 'pending') {
      throw new ConflictException('Cannot reject this friend request');
    }

    if (relationship.actionUserId === receiverId) {
      throw new UnauthorizedException(
        'You are not the receiver of this friend request',
      );
    }

    try {
      await this.friendshipsRepository.remove(relationship);
      return { message: 'Rejected friend request' };
    } catch (error) {
      throw new InternalServerErrorException('Could not reject friend request');
    }
  }

  async cancelFriendRequest(senderId: number, receiverId: number) {
    const relationship = await this.getRelationship(senderId, receiverId);

    if (!relationship) {
      throw new NotFoundException('Not found friend request');
    }

    if (relationship.status !== 'pending') {
      throw new ConflictException('Cannot cancel this friend request');
    }

    if (relationship.actionUserId !== senderId) {
      throw new UnauthorizedException(
        'You are not the sender of this friend request',
      );
    }

    try {
      await this.friendshipsRepository.remove(relationship);
      return { message: 'Cancelled friend request' };
    } catch (error) {
      throw new InternalServerErrorException('Could not cancel friend request');
    }
  }

  async unfriend(userId1: number, userId2: number) {
    const relationship = await this.getRelationship(userId1, userId2);

    if (!relationship) {
      throw new NotFoundException('Not found friendship');
    }

    if (relationship.status !== 'accepted') {
      throw new ConflictException('Cannot unfriend a non-friend');
    }

    try {
      await this.friendshipsRepository.remove(relationship);
      return { message: 'Đã hủy kết bạn thành công' };
    } catch (error) {
      throw new InternalServerErrorException('Could not unfriend user');
    }
  }

  async findMyFriends(userId: number) {
    try {
      const relationships = await this.friendshipsRepository
        .createQueryBuilder('friendship')
        .leftJoinAndSelect('friendship.userOne', 'userOne')
        .leftJoinAndSelect('friendship.userTwo', 'userTwo')
        .select([
          'friendship.status',
          'friendship.updatedAt',
          'userOne.userId',
          'userOne.username',
          'userOne.fullName',
          'userOne.avatarUrl',
          'userTwo.userId',
          'userTwo.username',
          'userTwo.fullName',
          'userTwo.avatarUrl',
        ])
        .where('friendship.status = :status', { status: 'accepted' })
        .andWhere(
          '(friendship.userOneId = :userId OR friendship.userTwoId = :userId)',
          { userId },
        )
        .getMany();

      const friends = relationships.map((rel) => {
        if (rel.userOne.userId === userId) {
          return rel.userTwo;
        } else {
          return rel.userOne;
        }
      });

      return friends;
    } catch (error) {
      throw new InternalServerErrorException('Error finding friends');
    }
  }

  async findReceivedRequests(userId: number) {
    try {
      const relationships = await this.friendshipsRepository
        .createQueryBuilder('friendship')
        .leftJoin('friendship.userOne', 'userOne')
        .leftJoin('friendship.userTwo', 'userTwo')
        .select([
          'userOne.userId',
          'userOne.username',
          'userOne.fullName',
          'userOne.avatarUrl',
          'userTwo.userId',
          'userTwo.username',
          'userTwo.fullName',
          'userTwo.avatarUrl',
          'friendship.actionUserId',
        ])
        .where('friendship.status = :status', { status: 'pending' })
        .andWhere(
          '(friendship.userOneId = :userId OR friendship.userTwoId = :userId)',
          { userId },
        )
        .andWhere('friendship.actionUserId != :userId', { userId })
        .getMany();

      const senders = relationships.map((rel) => {
        if (rel.actionUserId === rel.userOne.userId) {
          return rel.userOne;
        }
        return rel.userTwo;
      });

      return senders;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error finding received friend requests',
      );
    }
  }
}
