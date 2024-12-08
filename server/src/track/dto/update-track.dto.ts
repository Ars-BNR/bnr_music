import { ApiProperty } from '@nestjs/swagger';
import { IsInt,  IsOptional, IsString } from 'class-validator';

export class UpdateTrackDto {
  @ApiProperty({
    example: 'Sample',
    description: 'Новое имя трека',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 'Sam',
    description: 'Автор трека',
    required: false,
  })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiProperty({
    example: 'image.png',
    description: 'Имя картинки',
    required: false,
  })
  @IsOptional()
  @IsString()
  picture?: string;

  @ApiProperty({
    example: 'new song text',
    description: 'Текст песни',
    required: false,
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiProperty({
    example: 1200,
    description: 'Количество прослушиваний',
    required: false,
  })
  @IsOptional()
  @IsInt()
  listens?: number;

  @ApiProperty({
    example: 'audio-file.mp3',
    description: 'Аудиофайл трека',
    required: false,
  })
  @IsOptional()
  @IsString()
  audio?: string;
}
