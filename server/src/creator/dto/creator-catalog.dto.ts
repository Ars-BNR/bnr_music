import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
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

export class BulkDeleteCreatorReleasesDto {
  @Transform(transformIds)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids: number[];
}

export class CreateCreatorAlbumDto {
  @IsString()
  @MaxLength(255)
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
  @MaxLength(255)
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

  @IsOptional()
  @Transform(transformIds)
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  albumIds?: number[];
}

export class AssignCreatorAlbumTracksDto {
  @Transform(transformIds)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  trackIds: number[];
}

export class ReplaceCreatorAlbumCompositionDto {
  @Transform(transformIds)
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  trackIds: number[];
}

export class UpdateCreatorTrackDto {
  @IsOptional() @IsString() @MaxLength(255) name?: string;
  @IsOptional() @IsString() text?: string;
  @IsOptional()
  @Transform(transformGenreIds)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  genreIds?: number[];
  @IsOptional()
  @Transform(transformIds)
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  featuredAuthorIds?: number[];
  @IsOptional()
  @Transform(transformIds)
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  albumIds?: number[];
}

export class UpdateCreatorAlbumDto {
  @IsOptional() @IsString() @MaxLength(255) name?: string;
  @IsOptional()
  @Transform(transformIds)
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  featuredAuthorIds?: number[];
}

export class CreatorCatalogQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  query?: string;
}
