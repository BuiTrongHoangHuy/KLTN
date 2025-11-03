import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';
import { UpdatePostDto } from './dto/update-post.dto';
import type { JwtPayload } from '../auth/strategies/rt.strategy';
import { PostMedia } from './entities/post-media.entity';
import { HashtagsService } from '../hashtags/hashtags.service';
import { PostHashtag } from '../hashtags/entities/post-hashtag.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(PostMedia)
    private postMediaRepository: Repository<PostMedia>,
    private hashtagsService: HashtagsService,
  ) {}

  async create(createPostDto: CreatePostDto, userId: number) {
    return this.postsRepository.manager.transaction(
      async (transactionalEntityManager) => {
        try {
          const { content, medias, privacy } = createPostDto;

          const newPost = transactionalEntityManager.create(Post,{
            content,
            privacy,
            userId: userId,
          });

          if (medias && medias.length > 0) {
            newPost.medias = medias.map((media, index) =>
              transactionalEntityManager.create(PostMedia, {
                mediaUrl: media.url,
                mediaType: media.type,
                displayOrder: index,
              }),
            );
          }
          const savedPost = await transactionalEntityManager.save(newPost);
          const tagTexts = this.hashtagsService.extractHashtags(content);
          if (tagTexts.length > 0) {
            const hashtags =
              await this.hashtagsService.findOrCreateHashtags(tagTexts);

            const postHashtags = hashtags.map((tag) =>
              transactionalEntityManager.create(PostHashtag, {
                postId: savedPost.postId,
                hashtagId: tag.hashtagId,
              }),
            );

            await transactionalEntityManager.save(postHashtags);
          }
          return savedPost;
        } catch (error) {
          throw new InternalServerErrorException('Could not create post');
        }
      },
    );
  }

  findAll() {
    return `This action returns all posts`;
  }

  async findOne(id: number) {
    const post = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoin('post.user', 'user')
      .leftJoinAndSelect('post.medias', 'medias')
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
        'medias.mediaId',
        'medias.mediaUrl',
        'medias.mediaType',
        'medias.displayOrder',
      ])
      .where('post.postId = :id', { id })
      .orderBy('media.displayOrder', 'ASC')
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
      //this.postsRepository.merge(post, updatePostDto);

      await this.postsRepository.save(post);

      return post;
    } catch (error) {
      throw new InternalServerErrorException('Could not update post');
    }
  }

  async remove(id: number, user: JwtPayload) {
    const post = await this.postsRepository.findOneBy({ postId: id });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== user.sub) {
      throw new UnauthorizedException(
        'You do not have permission to delete this post',
      );
    }

    try {
      await this.postsRepository.remove(post);
      return { message: 'Delete success' };
    } catch (error) {
      throw new InternalServerErrorException('Could not delete post');
    }
  }
}
