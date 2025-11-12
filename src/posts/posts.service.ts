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

  async findAll() {
    const posts = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoin('post.user', 'user')
      .leftJoinAndSelect('post.medias', 'medias')
      .select([
        'post.postId',
        'post.content',
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
      .orderBy('medias.displayOrder', 'ASC')
      .orderBy('post.created_at', 'DESC')
      .getMany();

    if (!posts) {
      throw new NotFoundException('Post not found');
    }
    return posts;
  }

  async findAllPublic() {
    try {
      const { entities, raw } = await this.postsRepository
        .createQueryBuilder('post')
        .leftJoin('post.user', 'user')
        .leftJoinAndSelect('post.medias', 'medias')
        .select([
          'post.postId',
          'post.content',
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
        .addSelect((subQuery) => {
          return subQuery
            .select('COUNT(*)', 'count')
            .from('Likes', 'like')
            .where('like.postId = post.postId');
        }, 'likeCount')
        .addSelect((subQuery) => {
          return subQuery
            .select('COUNT(*)', 'count')
            .from('Comments', 'comment')
            .where('comment.postId = post.postId')
            .andWhere(
              "comment.analysisStatus IS NULL OR comment.analysisStatus != 'negative'",
            );
        }, 'commentCount')
        .where('post.privacy = :privacy', { privacy: 'public' })
        .orderBy('post.created_at', 'DESC')
        .addOrderBy('medias.displayOrder', 'ASC')
        .getRawAndEntities();

      const postsWithCounts = entities.map((post) => {
        const rawData = raw.find((r) => r.post_post_id === post.postId);
        return {
          ...post,
          likeCount: parseInt(rawData.likeCount) || 0,
          commentCount: parseInt(rawData.commentCount) || 0,
        };
      });

      return postsWithCounts;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error retrieving posts');
    }
  }

  async findById(id: number) {
    const { entities, raw } = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoin('post.user', 'user')
      .leftJoinAndSelect('post.medias', 'medias')
      .select([
        'post.postId',
        'post.content',
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

      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(*)', 'count')
          .from('Likes', 'like')
          .where('like.postId = post.postId');
      }, 'likeCount')

      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(*)', 'count')
          .from('Comments', 'comment')
          .where('comment.postId = post.postId')
          .andWhere(
            "comment.analysisStatus IS NULL OR comment.analysisStatus != 'negative'",
          );
      }, 'commentCount')

      .where('post.postId = :id', { id })
      .orderBy('medias.displayOrder', 'ASC')
      .getRawAndEntities();

    if (!entities || entities.length === 0) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    // 6. Gộp kết quả
    const post = entities[0];
    const rawData = raw[0];

    const result = {
      ...post,
      likeCount: parseInt(rawData.likeCount) || 0,
      commentCount: parseInt(rawData.commentCount) || 0,
    };

    return result;
  }

  async findOne(id: number) {
    const post = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoin('post.user', 'user')
      .leftJoinAndSelect('post.medias', 'medias')
      .select([
        'post.postId',
        'post.content',
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
      .orderBy('medias.displayOrder', 'ASC')
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
