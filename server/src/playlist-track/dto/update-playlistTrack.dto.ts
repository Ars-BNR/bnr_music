import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

export class UpdatePlaylistTrackDto {
  @ApiProperty({
    example: 1,
    description: 'id альбома',
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Должен быть целым числом' })
  playlistId: number;

  @ApiProperty({
    example: 1,
    description: 'id трека',
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Должен быть целым числом' })
  trackId: number;
}
