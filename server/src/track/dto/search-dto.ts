import { IsOptional, IsString } from 'class-validator';

export class searchDto {
  @IsOptional()
  @IsString()
  query: string;
}
