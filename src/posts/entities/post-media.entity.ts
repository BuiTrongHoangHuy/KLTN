import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Post } from './post.entity';

type MediaTypeEnum = 'image' | 'video';

@Entity({ name: 'Post_Media' })
export class PostMedia {
  @PrimaryGeneratedColumn({ name: 'media_id' })
  mediaId: number;

  @Column({ name: 'post_id' })
  postId: number;

  @Column({ name: 'media_url' })
  mediaUrl: string;

  @Column({
    name: 'media_type',
    type: 'enum',
    enum: ['image', 'video'],
  })
  mediaType: MediaTypeEnum;

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @ManyToOne(() => Post, (post) => post.medias)
  @JoinColumn({ name: 'post_id' })
  post: Post;
}
