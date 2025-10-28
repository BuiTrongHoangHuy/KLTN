import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  BadRequestException, NotFoundException, UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Friendship } from './entities/friendship.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FriendshipsService {
  constructor(
    @InjectRepository(Friendship)
    private friendshipsRepository: Repository<Friendship>,
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
}
