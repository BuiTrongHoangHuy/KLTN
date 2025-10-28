import { Module } from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from './entities/friendship.entity';
import { FriendshipsController } from './friendships.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Friendship])],
  providers: [FriendshipsService],
  exports: [FriendshipsService],
  controllers: [FriendshipsController],
})
export class FriendshipsModule {}
