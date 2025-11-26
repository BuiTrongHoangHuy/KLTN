import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { Repository } from 'typeorm';
import { CommentLike } from './entities/comment-like.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { Post } from '../posts/entities/post.entity';
import { CreateNotificationDto } from '../notifications/entities/create-notification.dto';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
    @InjectRepository(CommentLike)
    private commentLikesRepository: Repository<CommentLike>,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {}

  async togglePostLike(postId: number, userId: number) {
    const likeId = { userId: userId, postId: postId };

    try {
      const existingLike = await this.likesRepository.findOneBy(likeId);

      if (existingLike) {
        await this.likesRepository.remove(existingLike);
        return { message: 'Unlike post', liked: false };
      } else {
        const postOwner = await this.postsRepository.findOne({
          where: { postId: postId },
          select: ['userId'],
        });

        if (postOwner && postOwner.userId !== userId) {
          const notifDto: CreateNotificationDto = {
            recipientId: postOwner.userId,
            senderId: userId,
            type: 'like_post',
            targetId: postId,
          };

          const notification =
            await this.notificationsService.createNotification(notifDto);

          if (notification) {
            this.notificationsGateway.emitNotificationToUser(
              postOwner.userId,
              notification,
            );
          }
        }
        const newLike = this.likesRepository.create(likeId);
        await this.likesRepository.save(newLike);
        return { message: 'Like post', liked: true };
      }
    } catch (error) {
      throw new InternalServerErrorException('Could not toggle like status');
    }
  }

  async toggleCommentLike(commentId: number, userId: number) {
    const likeId = { userId: userId, commentId: commentId };

    try {
      const existingLike = await this.commentLikesRepository.findOneBy(likeId);

      if (existingLike) {
        await this.commentLikesRepository.remove(existingLike);
        return { message: 'Unlike Comment', liked: false };
      } else {
        const newLike = this.commentLikesRepository.create(likeId);
        await this.commentLikesRepository.save(newLike);
        return { message: 'Like Comment', liked: true };
      }
    } catch (error) {
      throw new InternalServerErrorException(
        'Could not toggle comment like status',
      );
    }
  }
}
