import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { JwtPayload } from '../auth/strategies/rt.strategy';
import { AtGuard } from '../auth/guards/at.guard';
import { FriendshipsService } from '../friendships/friendships.service';
import { FollowsService } from '../follows/follows.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly friendshipsService: FriendshipsService,
    private readonly followsService: FollowsService,
  ) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @UseGuards(AtGuard)
  getProfile(@GetUser() user: JwtPayload) {
    return this.usersService.findOne(user.sub);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch('me')
  @UseGuards(AtGuard)
  updateProfile(
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() user: JwtPayload,
  ) {
    return this.usersService.updateProfile(user.sub, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Post(':id/friend-request')
  @UseGuards(AtGuard)
  @HttpCode(HttpStatus.OK)
  sendFriendRequest(
    @Param('id', ParseIntPipe) receiverId: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.friendshipsService.sendFriendRequest(user.sub, receiverId);
  }

  @Post(':id/follow')
  @UseGuards(AtGuard)
  @HttpCode(HttpStatus.OK)
  toggleFollow(
    @Param('id', ParseIntPipe) followingId: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.followsService.toggleFollow(user.sub, followingId);
  }
}
