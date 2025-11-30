import { User } from 'src/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from 'typeorm';
import { Group } from './group.entity';

export type GroupRoleEnum = 'admin' | 'moderator' | 'member';

@Entity({ name: 'Group_Members' })
export class GroupMember {
    @PrimaryColumn({ name: 'group_id' })
    groupId: number;

    @PrimaryColumn({ name: 'user_id' })
    userId: number;

    @Column({
        type: 'enum',
        enum: ['admin', 'moderator', 'member'],
        default: 'member',
    })
    role: GroupRoleEnum;

    @CreateDateColumn({ name: 'joined_at' })
    joinedAt: Date;

    @ManyToOne(() => Group, (group) => group.members)
    @JoinColumn({ name: 'group_id' })
    group: Group;

    @ManyToOne(() => User, (user) => user.groupMemberships)
    @JoinColumn({ name: 'user_id' })
    user: User;
}
