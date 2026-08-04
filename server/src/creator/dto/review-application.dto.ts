import { IsString, Length } from 'class-validator';

export class ReviewApplicationDto {
  @IsString()
  @Length(5, 500)
  reviewNote: string;
}
