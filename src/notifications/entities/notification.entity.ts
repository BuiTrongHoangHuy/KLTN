import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

type NotificationTypeEnum =
  | 'like_post'
  | 'like_comment'
  | 'comment'
  | 'reply'
  | 'friend_request'
  | 'follow'
  | 'tag';

@Entity({ name: 'Notifications' })
export class Notification {
  @PrimaryGeneratedColumn({ name: 'notification_id' })
  notificationId: number;

  @Column({ name: 'recipient_id' })
  recipientId: number;

  @Column({ name: 'sender_id' })
  senderId: number;

  @Column({
    type: 'enum',
    enum: [
      'like_post',
      'like_comment',
      'comment',
      'reply',
      'friend_request',
      'follow',
      'tag',
    ],
  })
  type: NotificationTypeEnum;

  @Column({ name: 'target_id' })
  targetId: number;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.notificationsReceived)
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  @ManyToOne(() => User, (user) => user.notificationsSent)
  @JoinColumn({ name: 'sender_id' })
  sender: User;
}
