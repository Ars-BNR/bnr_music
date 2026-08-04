import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdatePlaylistDto {
  @ApiProperty({ example: 'New playlist name', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;
}
