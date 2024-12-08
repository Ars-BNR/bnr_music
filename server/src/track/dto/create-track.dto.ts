import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTrackDto {
  @ApiProperty({ example: 'Escape', description: 'Название трека' })
  @IsString({ message: 'Должно быть строкой' })
  readonly name: string;

  @ApiProperty({ example: 'Bryan Tyler', description: 'Автор трека' })
  @IsString({ message: 'Должно быть строкой' })
  readonly author: string;

  @ApiProperty({
    example: 'something text music',
    description: 'текст песни',
  })
  @IsString({ message: 'Должно быть строкой' })
  readonly text: string;
}
