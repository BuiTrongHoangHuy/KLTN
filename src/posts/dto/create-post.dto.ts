import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MediaInputDto } from './media-input.dto';

type PrivacyEnum = 'public' | 'friends' | 'private';

export class CreatePostDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaInputDto)
  @IsOptional()
  medias?: MediaInputDto[];

  @IsEnum(['public', 'friends', 'private'])
  @IsOptional()
  privacy?: PrivacyEnum;
}
