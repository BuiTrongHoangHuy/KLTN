import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import { Comment } from './entities/comment.entity';
import { LikesModule } from '../likes/likes.module';

@Module({
  imports: [TypeOrmModule.forFeature([Comment]), AiModule, LikesModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
