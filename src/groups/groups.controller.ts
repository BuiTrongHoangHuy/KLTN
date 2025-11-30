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
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AtGuard } from '../auth/guards/at.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { JwtPayload } from '../auth/strategies/rt.strategy';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) { }

  @Post()
  @UseGuards(AtGuard)
  create(@Body() createGroupDto: CreateGroupDto, @GetUser() user: JwtPayload) {
    return this.groupsService.create(createGroupDto, user.sub);
  }

  @Get()
  findAll() {
    return this.groupsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AtGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGroupDto: UpdateGroupDto,
    @GetUser() user: JwtPayload,
  ) {
    return this.groupsService.update(id, updateGroupDto, user.sub);
  }

  @Delete(':id')
  @UseGuards(AtGuard)
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.groupsService.remove(id, user.sub);
  }

  @Post(':id/join')
  @UseGuards(AtGuard)
  join(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.groupsService.join(id, user.sub);
  }

  @Post(':id/leave')
  @UseGuards(AtGuard)
  leave(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload) {
    return this.groupsService.leave(id, user.sub);
  }
}
