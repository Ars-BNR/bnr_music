import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreateAlbumTrackDto {
  @ApiProperty({
    example: 1,
    description: 'id альбома',
  })
  @IsInt({ message: 'Должен быть целым числом' })
  albumId: number;

  @ApiProperty({
    example: 1,
    description: 'id трека',
  })
  @IsInt({ message: 'Должен быть целым числом' })
  trackId: number;
}
