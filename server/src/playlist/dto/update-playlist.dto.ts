import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdatePlaylistDto {
  @ApiProperty({
    example: 'Sample',
    description: 'Новое имя плейлиста',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: '1',
    description: 'Id пользователя',
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Должно быть целым числом' })
  userId: string;
}
