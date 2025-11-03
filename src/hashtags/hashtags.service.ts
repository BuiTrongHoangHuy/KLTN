import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Hashtag } from './entities/hashtag.entity';
import { In, Repository } from 'typeorm';
import { PostHashtag } from './entities/post-hashtag.entity';

@Injectable()
export class HashtagsService {
  constructor(
    @InjectRepository(Hashtag)
    private hashtagsRepository: Repository<Hashtag>,
    @InjectRepository(PostHashtag)
    private postHashtagsRepository: Repository<PostHashtag>,
  ) {}

  extractHashtags(content?: string): string[] {
    if (!content) return [];
    const regex =
      /#([a-zA-Z0-9_àáâãèéêìíòóôõùúăđĩũơưăạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]+)/g;
    const matches = content.match(regex);
    if (!matches) return [];
    return [...new Set(matches.map((tag) => tag.substring(1).toLowerCase()))];
  }

  async findOrCreateHashtags(tagTexts: string[]): Promise<Hashtag[]> {
    if (tagTexts.length === 0) return [];

    const existingTags = await this.hashtagsRepository.findBy({
      tagText: In(tagTexts),
    });

    const existingTagTexts = existingTags.map((t) => t.tagText);
    const newTagTexts = tagTexts.filter((t) => !existingTagTexts.includes(t));

    const newTags = newTagTexts.map((tagText) =>
      this.hashtagsRepository.create({ tagText }),
    );
    const savedTags = await this.hashtagsRepository.save(newTags);

    return [...existingTags, ...savedTags];
  }

  async findPostsByTag(tagText: string) {
    const normalizedTag = tagText.toLowerCase();

    const hashtag = await this.hashtagsRepository.findOneBy({
      tagText: normalizedTag,
    });

    if (!hashtag) {
      throw new NotFoundException('Hashtag not found');
    }

    const relations = await this.postHashtagsRepository
      .createQueryBuilder('ph')
      .leftJoinAndSelect('ph.post', 'post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.medias', 'media')
      .select([
        'post.postId',
        'post.content',
        'post.privacy',
        'post.created_at',
        'user.userId',
        'user.username',
        'user.fullName',
        'user.avatarUrl',
        'media.mediaId',
        'media.mediaUrl',
        'media.mediaType',
      ])
      .where('ph.hashtagId = :hashtagId', { hashtagId: hashtag.hashtagId })
      .andWhere('post.privacy = :privacy', { privacy: 'public' })
      .orderBy('post.created_at', 'DESC')
      .getMany();

    const posts = relations.map((rel) => rel.post);
    return posts;
  }
}
