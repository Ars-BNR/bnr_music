import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreateCollectionAlbumDto {
  @ApiProperty({
    example: 1,
    description: 'id колекции',
    type: Number,
  })
  @IsInt()
  collectionId: number;

  @ApiProperty({
    example: 1,
    description: 'id альбома',
    type: Number,
  })
  @IsInt({ message: 'Должен быть целым числом' })
  albumId: number;
}
