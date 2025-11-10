import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
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
}
