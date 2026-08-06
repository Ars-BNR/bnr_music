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
  roles: string[];

  @ApiProperty({ type: [String] })
  permissions: string[];

  @ApiProperty()
  isActivated: boolean;
}
