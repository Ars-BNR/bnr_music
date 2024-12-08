import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreateCollectionPlaylistDto {
  @ApiProperty({
    example: 1,
    description: 'id колекции',
    type: Number,
  })
  @IsInt()
  collectionId: number;

  @ApiProperty({
    example: 1,
    description: 'id плейлиста',
    type: Number,
  })
  @IsInt({ message: 'Должен быть целым числом' })
  playlistId: number;
}
