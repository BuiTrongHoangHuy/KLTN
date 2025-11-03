import { Module } from '@nestjs/common';
import { HashtagsService } from './hashtags.service';
import { PostHashtag } from './entities/post-hashtag.entity';
import { Hashtag } from './entities/hashtag.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HashtagsController } from './hashtags.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Hashtag, PostHashtag])],
  providers: [HashtagsService],
  exports: [HashtagsService],
  controllers: [HashtagsController],
})
export class HashtagsModule {}
