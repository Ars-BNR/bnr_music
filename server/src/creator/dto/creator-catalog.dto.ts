import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { transformGenreIds } from 'src/track/dto/create-track.dto';

const transformIds = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return [];
  if (Array.isArray(value)) return value.map(Number);
  if (typeof value !== 'string') return value;
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.map(Number)
      : value.split(',').map(Number);
  } catch {
    return value.split(',').map((id) => Number(id.trim()));
  }
};

export class CreateCreatorAlbumDto {
  @IsString()
  name: string;

  @IsOptional()
  @Transform(transformIds)
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  featuredAuthorIds?: number[];
}

export class CreateCreatorTrackDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  text?: string;

  @Transform(transformGenreIds)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  genreIds: number[];

  @IsOptional()
  @Transform(transformIds)
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  featuredAuthorIds?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  albumId?: number;
}
