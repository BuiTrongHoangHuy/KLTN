import { Comment } from 'src/comments/entities/comment.entity';
import { Post } from 'src/posts/entities/post.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

type ReportStatusEnum = 'pending' | 'resolved';

@Entity({ name: 'Reports' })
@Check(
  `("post_id" IS NOT NULL AND "comment_id" IS NULL) OR ("post_id" IS NULL AND "comment_id" IS NOT NULL)`,
)
export class Report {
  @PrimaryGeneratedColumn({ name: 'report_id' })
  reportId: number;

  @Column({ name: 'reporter_id' })
  reporterId: number;

  @Column({ name: 'post_id', nullable: true })
  postId: number;

  @Column({ name: 'comment_id', nullable: true })
  commentId: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'resolved'],
    default: 'pending',
  })
  status: ReportStatusEnum;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.reports)
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @ManyToOne(() => Post, (post) => post.reports)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => Comment, (comment) => comment.reports)
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;
}
