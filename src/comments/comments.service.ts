import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiService } from '../ai/ai.service';
import { Comment } from './entities/comment.entity';
import type { JwtPayload } from '../auth/strategies/rt.strategy';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateNotificationDto } from 'src/notifications/entities/create-notification.dto';
import { Post } from '../posts/entities/post.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    private aiService: AiService,
    private notificationsService: NotificationsService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(
    createCommentDto: CreateCommentDto,
    postId: number,
    userId: number,
  ) {
    const { content, parentCommentId } = createCommentDto;

    try {
      const newComment = this.commentsRepository.create({
        content,
        postId,
        userId,
        parentCommentId: parentCommentId || undefined,
      });

      const savedComment = await this.commentsRepository.save(newComment);
      await this.sendCommentNotification(savedComment, userId, postId);
      return newComment;
    } catch (error) {
      throw new InternalServerErrorException('Could not create comment');
    }
  }

  private async sendCommentNotification(
    comment: Comment,
    senderId: number,
    postId: number,
  ) {
    if (comment.parentCommentId) {
      const parentComment = await this.commentsRepository.findOne({
        where: { commentId: comment.parentCommentId },
        select: ['userId'],
      });

      if (parentComment && parentComment.userId !== senderId) {
        const notifDto: CreateNotificationDto = {
          recipientId: parentComment.userId,
          senderId: senderId,
          type: 'reply',
          targetId: postId,
        };
        this.createAndEmitNotification(notifDto);
      }
    }

    const postOwner = await this.postsRepository.findOne({
      where: { postId: postId },
      select: ['userId'],
    });

    if (postOwner && postOwner.userId !== senderId) {
      const notifDto: CreateNotificationDto = {
        recipientId: postOwner.userId,
        senderId: senderId,
        type: 'comment',
        targetId: postId,
      };
      await this.createAndEmitNotification(notifDto);
    }
  }


  private async createAndEmitNotification(dto: CreateNotificationDto) {
    const notification =
      await this.notificationsService.createNotification(dto);
    if (notification) {
      this.notificationsGateway.emitNotificationToUser(
        dto.recipientId,
        notification,
      );
    }
  }
  async findAllByPostId(postId: number) {
    try {
      const comments = await this.commentsRepository
        .createQueryBuilder('comment')
        .leftJoin('comment.user', 'user')
        .select([
          'comment.commentId',
          'comment.content',
          'comment.parentCommentId',
          'comment.createdAt',
          'user.userId',
          'user.username',
          'user.fullName',
          'user.avatarUrl',
        ])
        .where('comment.postId = :postId', { postId })
        .orderBy('comment.createdAt', 'DESC')
        .getMany();

      return comments;
    } catch (error) {
      throw new InternalServerErrorException('Could not retrieve comments');
    }
  }

  async update(
    commentId: number,
    updateCommentDto: UpdateCommentDto,
    userId: number,
  ) {
    const comment = await this.commentsRepository.findOneBy({
      commentId: commentId,
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new UnauthorizedException(
        'You do not have permission to edit this comment.',
      );
    }

    const { content } = updateCommentDto;
    const analysisStatus = await this.aiService.analyzeComment(content);

    if (analysisStatus === 'negative') {
      throw new ForbiddenException(
        'Comment update rejected due to inappropriate content',
      );
    }

    try {
      comment.content = content;
      comment.analysisStatus = analysisStatus;
      await this.commentsRepository.save(comment);
      return comment;
    } catch (error) {
      throw new InternalServerErrorException('Could not update comment');
    }
  }

  async remove(commentId: number, user: JwtPayload) {
    const comment = await this.commentsRepository.findOneBy({
      commentId: commentId,
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== user.sub && user.role !== 'admin') {
      throw new UnauthorizedException(
        'You do not have permission to delete this comment.',
      );
    }

    try {
      await this.commentsRepository.remove(comment);
      return { message: 'Delete success' };
    } catch (error) {
      throw new InternalServerErrorException('Could not delete comment');
    }
  }
}
