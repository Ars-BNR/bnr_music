import { ApiProperty } from '@nestjs/swagger';

export class UserResponse {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ example: { sub: 1, email: 'user@example.com', role: 'user' } })
  user: { sub: number; email: string; role: string };
}
