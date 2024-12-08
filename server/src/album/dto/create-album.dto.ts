import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateAlbumDto {
  @ApiProperty({
    example: "Assassin's Creed II",
    description: 'Название альбома',
  })
  @IsString({ message: 'Должно быть строкой' })
  name: string;
}
