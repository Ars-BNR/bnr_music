import { IsString, Length } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @Length(4, 128)
  currentPassword: string;

  @IsString()
  @Length(4, 128)
  newPassword: string;
}
