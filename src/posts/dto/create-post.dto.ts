import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';

type PrivacyEnum = 'public' | 'friends' | 'private';

export class CreatePostDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsUrl()
  @IsOptional()
  mediaUrl?: string;

  @IsEnum(['public', 'friends', 'private'])
  @IsOptional()
  privacy?: PrivacyEnum;
}
