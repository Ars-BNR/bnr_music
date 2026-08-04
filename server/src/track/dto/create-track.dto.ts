import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class CreateTrackDto {
  @ApiProperty({ example: 'Escape' })
  @IsString()
  readonly name: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly authorId: number;

  @ApiProperty({ example: 'Song lyrics' })
  @IsString()
  readonly text: string;
}
