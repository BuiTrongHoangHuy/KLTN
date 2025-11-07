import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreateReportDto {
  @IsInt()
  @IsOptional()
  @ValidateIf((o) => !o.commentId)
  postId?: number;

  @IsInt()
  @IsOptional()
  @ValidateIf((o) => !o.postId)
  commentId?: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
