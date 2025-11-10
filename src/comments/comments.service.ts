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

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    private aiService: AiService,
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

      await this.commentsRepository.save(newComment);
      return newComment;
    } catch (error) {
      throw new InternalServerErrorException('Could not create comment');
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

}
