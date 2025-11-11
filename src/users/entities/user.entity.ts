import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { Like } from '../../likes/entities/like.entity';
import { CommentLike } from '../../likes/entities/comment-like.entity';
import { Friendship } from '../../friendships/entities/friendship.entity';
import { Report } from 'src/reports/entities/report.entity';
import { Notification } from 'src/notifications/entities/notification.entity';
@Entity({ name: 'Users' })
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId: number;

  @Column({ unique: true, length: 50, nullable: false })
  username: string;

  @Column({ unique: true, length: 100, nullable: false })
  email: string;

  @Column({ name: 'password_hash', nullable: false })
  passwordHash: string;

  @Column({ name: 'full_name', length: 100, nullable: false })
  fullName: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({
    type: 'enum',
    enum: ['user', 'admin'],
    default: 'user',
  })
  role: string;

  @Column({ name: 'hashed_refresh_token', nullable: true })
  hashedRefreshToken: string;

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  @OneToMany(() => CommentLike, (like) => like.user)
  commentLikes: CommentLike[];

  @OneToMany(() => Friendship, (friendship) => friendship.userOne)
  friendshipsInitiated: Friendship[]; // userId = user_one_id

  @OneToMany(() => Friendship, (friendship) => friendship.userOne)
  friendshipsReceived: Friendship[]; // userId = user_two_id

  @OneToMany(() => Report, (report) => report.reporter)
  reports: Report[];

  @OneToMany(() => Notification, (n) => n.recipient)
  notificationsReceived: Notification[];

  @OneToMany(() => Notification, (n) => n.sender)
  notificationsSent: Notification[];
}
