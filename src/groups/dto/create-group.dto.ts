import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { GroupPrivacyEnum } from '../entities/group.entity';

export class CreateGroupDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['public', 'private'])
  privacy?: GroupPrivacyEnum;
}
