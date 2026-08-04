import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  @Transform(({ value }) => value?.trim())
  displayName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 280)
  @Transform(({ value }) => value?.trim())
  bio?: string;
}
