import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class UpdateCollectionPlaylistDto {
  @ApiProperty({
    example: 1,
    description: 'id плейлиста',
    required: false,
    type: Number,
  })
  @IsInt({ message: 'Должен быть целым числом' })
  playlistId: number;
}
