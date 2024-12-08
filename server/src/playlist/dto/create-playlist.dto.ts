import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class CreatePlaylistDto {
  @ApiProperty({ example: 'Phonk', description: 'Название плейлиста' })
  @IsString({ message: 'Должно быть строкой' })
  name: string;

  @ApiProperty({ example: '1', description: 'Id пользователя' })
  @IsInt({ message: 'Должно быть целым числом' })
  userId: string;
}
