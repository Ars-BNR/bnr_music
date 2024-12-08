import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreatePlaylistTrackDto {
  @ApiProperty({
    example: 1,
    description: 'id плейлиста',
  })
  @IsInt({ message: 'Должен быть целым числом' })
  playlistId: number;

  @ApiProperty({
    example: 1,
    description: 'id трека',
  })
  @IsInt({ message: 'Должен быть целым числом' })
  trackId: number;
}
