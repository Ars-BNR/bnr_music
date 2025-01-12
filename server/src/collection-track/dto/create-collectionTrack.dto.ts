import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreateCollectionTrackDto {
  @ApiProperty({
    example: 1,
    description: 'id колекции',
    type: Number,
  })
  @IsInt()
  collectionId: number;

  @ApiProperty({
    example: 1,
    description: 'id трека',
    type: Number,
  })
  @IsInt({ message: 'Должен быть целым числом' })
  trackId: number;
}
