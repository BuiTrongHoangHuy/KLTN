import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { GroupJoinRequest } from './entities/group-join-request.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupsRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private groupMembersRepository: Repository<GroupMember>,
    @InjectRepository(GroupJoinRequest)
    private groupJoinRequestsRepository: Repository<GroupJoinRequest>,
  ) { }

  async create(createGroupDto: CreateGroupDto, creatorId: number) {
    const group = this.groupsRepository.create({
      ...createGroupDto,
      creatorId,
      memberCount: 1,
    });
    const savedGroup = await this.groupsRepository.save(group);

    const member = this.groupMembersRepository.create({
      groupId: savedGroup.groupId,
      userId: creatorId,
      role: 'admin',
    });
    await this.groupMembersRepository.save(member);

    return savedGroup;
  }

  findAll() {
    return this.groupsRepository.find({
      where: { privacy: 'public' },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const group = await this.groupsRepository.findOne({
      where: { groupId: id },
      relations: ['members', 'members.user'],
    });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async update(id: number, updateGroupDto: UpdateGroupDto, userId: number) {
    const group = await this.findOne(id);
    const member = await this.groupMembersRepository.findOneBy({
      groupId: id,
      userId,
    });

    if (!member || member.role !== 'admin') {
      throw new ForbiddenException('Only admin can update group');
    }

    Object.assign(group, updateGroupDto);
    return this.groupsRepository.save(group);
  }

  async remove(id: number, userId: number) {
    const group = await this.findOne(id);
    const member = await this.groupMembersRepository.findOneBy({
      groupId: id,
      userId,
    });

    if (!member || member.role !== 'admin') {
      throw new ForbiddenException('Only admin can delete group');
    }

    return this.groupsRepository.remove(group);
  }

  async join(groupId: number, userId: number) {
    const group = await this.findOne(groupId);
    const existingMember = await this.groupMembersRepository.findOneBy({
      groupId,
      userId,
    });

    if (existingMember) {
      throw new BadRequestException('Already a member');
    }

    if (group.privacy === 'private') {
      const existingRequest = await this.groupJoinRequestsRepository.findOneBy({
        groupId,
        userId,
      });
      if (existingRequest) {
        throw new BadRequestException('Join request already sent');
      }

      const request = this.groupJoinRequestsRepository.create({
        groupId,
        userId,
      });
      await this.groupJoinRequestsRepository.save(request);
      return { message: 'Join request sent' };
    }

    const newMember = this.groupMembersRepository.create({
      groupId,
      userId,
      role: 'member',
    });
    await this.groupMembersRepository.save(newMember);

    group.memberCount++;
    await this.groupsRepository.save(group);

    return { message: 'Joined group successfully' };
  }
}
