import { IsString, MaxLength, MinLength } from 'class-validator';

export class ConfirmPasswordResetDto {
  @IsString()
  @MinLength(20)
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
