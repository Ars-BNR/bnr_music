import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class AlbumCatalogQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 100)
  query?: string;
}
