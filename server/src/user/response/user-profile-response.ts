import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty()
  bio: string;

  @ApiProperty({ nullable: true })
  avatar: string | null;

  @ApiProperty()
  role: string;

  @ApiProperty()
  isActivated: boolean;
}
