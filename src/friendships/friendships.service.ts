import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  BadRequestException,
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
}