import { Controller, Get, Param } from '@nestjs/common';
import { HashtagsService } from './hashtags.service';

@Controller('hashtags')
export class HashtagsController {
  constructor(private readonly hashtagsService: HashtagsService) {}

  @Get(':tagText')
  findPostsByTag(@Param('tagText') tagText: string) {
    return this.hashtagsService.findPostsByTag(tagText);
  }
}
