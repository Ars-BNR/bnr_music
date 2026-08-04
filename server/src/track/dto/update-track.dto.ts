import { ApiProperty } from '@nestjs/swagger';
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
import { transformGenreIds } from './create-track.dto';

export class UpdateTrackDto {
  @ApiProperty({ example: 'Sample', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  authorId?: number;

  @ApiProperty({ example: 'image.png', required: false })
  @IsOptional()
  @IsString()
  picture?: string;

  @ApiProperty({ example: 'new song text', required: false })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiProperty({ example: 1200, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  listens?: number;

  @ApiProperty({ example: 'audio-file.mp3', required: false })
  @IsOptional()
  @IsString()
  audio?: string;

  @ApiProperty({ example: [1, 2], type: [Number], required: false })
  @IsOptional()
  @Transform(transformGenreIds)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  genreIds?: number[];
}
