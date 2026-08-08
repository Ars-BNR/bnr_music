import { Transform, Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class AdminUsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  query?: string;
  @IsOptional() @IsIn(['active', 'blocked', 'deleted']) status?:
    | 'active'
    | 'blocked'
    | 'deleted';
}

export class AdminUserIdDto {
  @Type(() => Number) id: number;
}
