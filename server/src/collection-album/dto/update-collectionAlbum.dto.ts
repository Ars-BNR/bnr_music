import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateCollectionAlbumDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) collectionId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) albumId?: number;
}
