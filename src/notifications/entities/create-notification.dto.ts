export class CreateNotificationDto {
  recipientId: number;
  senderId: number;
  type:
    | 'like_post'
    | 'like_comment'
    | 'comment'
    | 'reply'
    | 'friend_request'
    | 'follow'
    | 'tag';
  targetId: number;
}
