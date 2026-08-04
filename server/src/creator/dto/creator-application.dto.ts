import { IsString, Length } from 'class-validator';

export class CreatorApplicationDto {
  @IsString()
  @Length(2, 80)
  stageName: string;

  @IsString()
  @Length(20, 500)
  bio: string;
}
