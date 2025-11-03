import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { LikesModule } from '../likes/likes.module';
import { PostMedia } from './entities/post-media.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostMedia]),
    LikesModule,
    CloudinaryModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
