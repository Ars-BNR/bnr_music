import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
export class UpdateAlbumTrackDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) albumId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) trackId?: number;
}
