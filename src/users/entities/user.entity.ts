import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'Users' }) // Tên bảng trong CSDL
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ unique: true, length: 50, nullable: false })
  username: string;

  @Column({ unique: true, length: 100, nullable: false })
  email: string;

  @Column({ name: 'password_hash', nullable: false })
  passwordHash: string;

  @Column({ length: 100, nullable: false })
  full_name: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({
    type: 'enum',
    enum: ['user', 'admin'],
    default: 'user',
  })
  role: string;

}
