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
  ) {}
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
    const user = await this.usersRepository.findOne({
      where: { userId: id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, hashedRefreshToken, ...result } = user;
    return result;
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
