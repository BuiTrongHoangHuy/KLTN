import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private likesRepository: Repository<Like>,
  ) {}

  async togglePostLike(postId: number, userId: number) {
    const likeId = { userId: userId, postId: postId };

    try {
      const existingLike = await this.likesRepository.findOneBy(likeId);

      if (existingLike) {
        await this.likesRepository.remove(existingLike);
        return { message: 'Unlike post', liked: false };
      } else {
        const newLike = this.likesRepository.create(likeId);
        await this.likesRepository.save(newLike);
        return { message: 'Like post', liked: true };
      }
    } catch (error) {
      throw new InternalServerErrorException('Could not toggle like status');
    }
  }
}