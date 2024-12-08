import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class UpdateCollectionAlbumDto {
  @ApiProperty({
    example: 1,
    description: 'id альбома',
    required: false,
    type: Number,
  })
  @IsInt({ message: 'Должен быть целым числом' })
  albumId: number;
}
