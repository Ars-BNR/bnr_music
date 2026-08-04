import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class PlaylistTrackDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  trackId: number;
}
