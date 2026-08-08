import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateCreatorProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 80)
  stageName?: string;

  @IsOptional()
  @IsString()
  @Length(20, 500)
  bio?: string;
}

export class DeleteCreatorProfileDto {
  @IsString()
  @Length(1, 72)
  currentPassword: string;

  @IsString()
  @Length(2, 80)
  stageName: string;
}
