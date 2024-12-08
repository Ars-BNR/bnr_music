import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
export class UserJWTData {
  @ApiProperty({ example: 'Milius', description: 'Логин пользователя' })
  @IsString()
  login: string;

  @ApiProperty({ example: '1', description: 'Id пользователя' })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 'user', description: 'Роль пользователя' })
  @IsString()
  role: string;

  constructor(model: UserJWTData) {
    this.login = model.login;
    this.id = model.id;
    this.role = model.role;
  }
}
export class UserResponse {
  @ApiProperty({ example: '1ygt@hjyk!GFgak', description: 'Токен доступа пользователя' })
  @IsString()
  accessToken: string;
  @ApiProperty({ example: '1ygt@hjyk!GFgak', description: 'refresh токен пользователя' })
  @IsString()
  refreshToken: string;
  @ApiProperty()
  @IsString()
  user: UserJWTData;
}
