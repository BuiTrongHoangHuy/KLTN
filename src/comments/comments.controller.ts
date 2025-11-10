import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { AtGuard } from '../auth/guards/at.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { JwtPayload } from '../auth/strategies/rt.strategy';
import { LikesService } from '../likes/likes.service';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly likesService: LikesService,
  ) {}

  @Post()
  @UseGuards(AtGuard)
  create(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() createCommentDto: CreateCommentDto,
    @GetUser() user: JwtPayload,
  ) {
    return this.commentsService.create(createCommentDto, postId, user.sub);
  }

  @Get()
  findAllById(@Param('postId', ParseIntPipe) postId: number) {
    return this.commentsService.findAllByPostId(postId);
  }

  @Patch(':id')
  @UseGuards(AtGuard)
  update(
    @Param('id', ParseIntPipe) commentId: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @GetUser() user: JwtPayload,
  ) {
    return this.commentsService.update(commentId, updateCommentDto, user.sub);
  }

  @Delete(':id')
  @UseGuards(AtGuard)
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id', ParseIntPipe) commentId: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.commentsService.remove(commentId, user);
  }

  @Post(':id/like')
  @UseGuards(AtGuard)
  @HttpCode(HttpStatus.OK)
  toggleLike(
    @Param('id', ParseIntPipe) commentId: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.likesService.toggleCommentLike(commentId, user.sub);
  }
}
