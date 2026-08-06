import { ApiProperty } from '@nestjs/swagger';

export class UserResponse {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({
    example: {
      sub: 1,
      email: 'user@example.com',
      roles: ['user'],
      permissions: ['profile.manage-own'],
    },
  })
  user: {
    sub: number;
    email: string;
    roles: string[];
    permissions: string[];
  };
}
