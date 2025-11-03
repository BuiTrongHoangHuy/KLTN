import { User } from 'src/users/entities/user.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Like } from '../../likes/entities/like.entity';
import { PostMedia } from './post-media.entity';
import { PostHashtag } from '../../hashtags/entities/post-hashtag.entity';

type PrivacyEnum = 'public' | 'friends' | 'private';

@Entity({ name: 'Posts' })
export class Post {
  @PrimaryGeneratedColumn({ name: 'post_id' })
  postId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({
    type: 'enum',
    enum: ['public', 'friends', 'private'],
    default: 'public',
  })
  privacy: PrivacyEnum;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  @OneToMany(() => PostMedia, (media) => media.post, {
    cascade: true,
  })
  medias: PostMedia[];

  @OneToMany(() => PostHashtag, (postHashtag) => postHashtag.post)
  hashtags: PostHashtag[];
}
