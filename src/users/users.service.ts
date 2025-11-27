import {
  ConflictException,
  Injectable,
  InternalServerErrorException, NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }
  async create(createUserDto: CreateUserDto) {
    try {
      const { username, email, password, fullName } = createUserDto;
      console.log(createUserDto);
      const existingUser = await this.usersRepository.findOne({
        where: [{ email }, { username }],
      });

      if (existingUser) {
        throw new Error('Username or email already exists');
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = this.usersRepository.create({
        username,
        email,
        passwordHash,
        fullName,
        role: 'user',
      });

      await this.usersRepository.save(newUser);

      //const { passwordHash: _, ...result } = newUser;
      return newUser;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Internal server error');
    }
  }

  findAll() {
    return `This action returns all users`;
  }

  async findOne(id: number) {
    const { entities, raw } = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.userId = :id', { id })
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(p.post_id)', 'postsCount')
            .from('Posts', 'p')
            .where('p.user_id = user.user_id'),
        'postsCount',
      )
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(f.follower_id)', 'followersCount')
            .from('Follows', 'f')
            .where('f.following_id = user.user_id'),
        'followersCount',
      )
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(f.following_id)', 'followingCount')
            .from('Follows', 'f')
            .where('f.follower_id = user.user_id'),
        'followingCount',
      )
      .addSelect(
        (subQuery) =>
          subQuery
            .select('COUNT(*)', 'friendsCount')
            .from('Friendships', 'fr')
            .where(
              "(fr.user_one_id = user.user_id OR fr.user_two_id = user.user_id) AND fr.status = 'accepted'",
            ),
        'friendsCount',
      )
      .getRawAndEntities();

    const user = entities[0];

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const rawData = raw[0];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, hashedRefreshToken, ...result } = user;

    return {
      ...result,
      postsCount: parseInt(rawData.postsCount || '0', 10),
      followersCount: parseInt(rawData.followersCount || '0', 10),
      followingCount: parseInt(rawData.followingCount || '0', 10),
      friendsCount: parseInt(rawData.friendsCount || '0', 10),
    };
  }

  async updateProfile(userId: number, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOneBy({ userId: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      this.usersRepository.merge(user, updateUserDto);
      await this.usersRepository.save(user);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, hashedRefreshToken, ...result } = user;
      return result;
    } catch (error) {
      throw new InternalServerErrorException('Error updating profile');
    }
  }
  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
