import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreatePlaylistDto {
  @ApiProperty({ example: 'Phonk' })
  @IsString()
  @Length(1, 120)
  name: string;
}
