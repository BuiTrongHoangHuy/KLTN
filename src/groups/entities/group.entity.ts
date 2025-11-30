import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GroupMember } from './group-member.entity';
import { Post } from '../../posts/entities/post.entity';

export type GroupPrivacyEnum = 'public' | 'private';

@Entity({ name: 'Groups' })
export class Group {
  @PrimaryGeneratedColumn({ name: 'group_id' })
  groupId: number;

  @Column({ length: 100, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'cover_url', nullable: true })
  coverUrl: string;

  @Column({
    type: 'enum',
    enum: ['public', 'private'],
    default: 'public',
  })
  privacy: GroupPrivacyEnum;

  @Column({ name: 'creator_id' })
  creatorId: number;

  @Column({ name: 'member_count', default: 1 })
  memberCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @OneToMany(() => GroupMember, (member) => member.group)
  members: GroupMember[];

  @OneToMany(() => Post, (post) => post.group)
  posts: Post[];
}
