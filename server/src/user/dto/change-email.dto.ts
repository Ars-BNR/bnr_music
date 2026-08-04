import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';

export class ChangeEmailDto {
  @IsString()
  @Length(4, 128)
  currentPassword: string;

  @IsEmail()
  @Transform(({ value }) => value?.trim().toLowerCase())
  newEmail: string;
}
