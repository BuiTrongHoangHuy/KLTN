import { Post } from 'src/posts/entities/post.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Hashtag } from './hashtag.entity';

@Entity({ name: 'Post_Hashtags' })
export class PostHashtag {
  @PrimaryColumn({ name: 'post_id' })
  postId: number;

  @PrimaryColumn({ name: 'hashtag_id' })
  hashtagId: number;

  @ManyToOne(() => Post, (post) => post.hashtags)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => Hashtag, (hashtag) => hashtag.hashtags)
  @JoinColumn({ name: 'hashtag_id' })
  hashtag: Hashtag;
}
