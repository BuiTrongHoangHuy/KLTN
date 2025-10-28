import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';
import { UpdatePostDto } from './dto/update-post.dto';
import type { JwtPayload } from '../auth/strategies/rt.strategy';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
  ) {}

  async create(createPostDto: CreatePostDto, userId: number) {
    try {
      const { content, mediaUrl, privacy } = createPostDto;

      const newPost = this.postsRepository.create({
        content,
        mediaUrl,
        privacy,
        userId: userId,
      });

      await this.postsRepository.save(newPost);

      return newPost;
    } catch (error) {
      throw new InternalServerErrorException('Could not create post');
    }
  }

  findAll() {
    return `This action returns all posts`;
  }

  async findOne(id: number) {
    const post = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoin('post.user', 'user')
      .select([
        'post.postId',
        'post.content',
        'post.mediaUrl',
        'post.privacy',
        'post.created_at',
        'user.userId',
        'user.username',
        'user.fullName',
        'user.avatarUrl',
      ])
      .where('post.postId = :id', { id })
      .getOne();

    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto, user: JwtPayload) {
    const post = await this.postsRepository.findOneBy({ postId: id });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== user.sub) {
      throw new UnauthorizedException(
        'You do not have permission to update this post',
      );
    }

    try {
      this.postsRepository.merge(post, updatePostDto);

      await this.postsRepository.save(post);

      return post;
    } catch (error) {
      throw new InternalServerErrorException('Could not update post');
    }
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
