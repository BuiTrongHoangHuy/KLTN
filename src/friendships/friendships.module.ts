import { Module } from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from './entities/friendship.entity';
import { FriendshipsController } from './friendships.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Friendship]), NotificationsModule],
  providers: [FriendshipsService],
  exports: [FriendshipsService],
  controllers: [FriendshipsController],
})
export class FriendshipsModule {}
