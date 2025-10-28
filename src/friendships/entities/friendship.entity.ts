import { User } from 'src/users/entities/user.entity';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

type FriendshipStatusEnum = 'pending' | 'accepted' | 'blocked';

@Entity({ name: 'Friendships' })
@Check(`"user_one_id" < "user_two_id"`)
export class Friendship {
  @PrimaryColumn({ name: 'user_one_id' })
  userOneId: number;

  @PrimaryColumn({ name: 'user_two_id' })
  userTwoId: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'accepted', 'blocked'],
  })
  status: FriendshipStatusEnum;

  @Column({ name: 'action_user_id' })
  actionUserId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.friendshipsInitiated)
  @JoinColumn({ name: 'user_one_id' })
  userOne: User;

  @ManyToOne(() => User, (user) => user.friendshipsReceived)
  @JoinColumn({ name: 'user_two_id' })
  userTwo: User;
}