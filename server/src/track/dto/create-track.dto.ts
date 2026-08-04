import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsInt,
  IsString,
  Min,
} from 'class-validator';

const transformGenreIds = ({ value }: { value: unknown }) => {
  if (Array.isArray(value)) return value.map(Number);
  if (typeof value !== 'string') return value;

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return parsed.map(Number);
  } catch {
    return value.split(',').map((id) => Number(id.trim()));
  }

  return value;
};

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

  @ApiProperty({ example: [1, 2], type: [Number] })
  @Transform(transformGenreIds)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  readonly genreIds: number[];
}

export { transformGenreIds };
