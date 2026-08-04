import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
export class UpdatePlaylistTrackDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) playlistId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) trackId?: number;
}
