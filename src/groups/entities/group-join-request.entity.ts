import { User } from 'src/users/entities/user.entity';
import {
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from 'typeorm';
import { Group } from './group.entity';

@Entity({ name: 'Group_Join_Requests' })
export class GroupJoinRequest {
    @PrimaryColumn({ name: 'group_id' })
    groupId: number;

    @PrimaryColumn({ name: 'user_id' })
    userId: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => Group)
    @JoinColumn({ name: 'group_id' })
    group: Group;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;
}
