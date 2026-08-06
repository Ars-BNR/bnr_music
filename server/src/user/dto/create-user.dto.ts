import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Mihail@mail.com', description: 'Email' })
  @IsEmail()
  @IsString({ message: 'Должно быть строкой' })
  readonly email: string;

  @ApiProperty({ example: '123142', description: 'Пароль' })
  @IsString({ message: 'Должно быть строкой' })
  @Length(4, 16, { message: 'Не меньше 4 и не больше 16' })
  password: string;
}
