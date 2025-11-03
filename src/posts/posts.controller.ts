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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AtGuard } from '../auth/guards/at.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { JwtPayload } from '../auth/strategies/rt.strategy';
import { LikesService } from '../likes/likes.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly likesService: LikesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(AtGuard)
  create(@Body() createPostDto: CreatePostDto, @GetUser() user: JwtPayload) {
    return this.postsService.create(createPostDto, user.sub);
  }

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AtGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @GetUser() user: JwtPayload,
  ) {
    return this.postsService.update(id, updatePostDto, user);
  }

  @Delete(':id')
  @UseGuards(AtGuard)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.postsService.remove(+id, user);
  }

  @Post(':id/like')
  @UseGuards(AtGuard)
  @HttpCode(HttpStatus.OK)
  toggleLike(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.likesService.togglePostLike(id, user.sub);
  }

  @Post('upload')
  @UseGuards(AtGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const uploadResult = await this.cloudinaryService.uploadFile(file);
      return {
        url: uploadResult.secure_url,
        type: uploadResult.resource_type,
      };
    } catch(error) {
      throw new BadRequestException('File upload failed');
    }
  }
}
