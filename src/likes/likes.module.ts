import { Module } from '@nestjs/common';
import { LikesService } from './likes.service';
import { Like } from './entities/like.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentLike } from './entities/comment-like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Like, CommentLike])],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule {}
