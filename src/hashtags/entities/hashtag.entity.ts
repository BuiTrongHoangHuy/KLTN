import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PostHashtag } from './post-hashtag.entity';

@Entity({ name: 'Hashtags' })
export class Hashtag {
  @PrimaryGeneratedColumn({ name: 'hashtag_id' })
  hashtagId: number;

  @Column({ name: 'tag_text', unique: true, length: 100 })
  @Index()
  tagText: string;

  @OneToMany(() => PostHashtag, (postHashtag) => postHashtag.hashtag)
  hashtags: PostHashtag[];
}
