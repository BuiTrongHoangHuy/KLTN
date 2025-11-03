import { IsEnum, IsUrl } from 'class-validator';

export class MediaInputDto {
  @IsUrl()
  url: string;

  @IsEnum(['image', 'video'], { message: 'Invalid media' })
  type: 'image' | 'video';
}
