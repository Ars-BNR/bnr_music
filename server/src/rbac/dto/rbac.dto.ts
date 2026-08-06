import { Transform, Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateRoleDto {
  @Transform(trim)
  @IsString()
  @Matches(/^[a-z][a-z0-9._-]{1,63}$/)
  code: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @Length(2, 120)
  name: string;

  @Transform(trim)
  @IsString()
  @MaxLength(280)
  description = '';

  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  permissionIds: number[];
}

export class UpdateRoleDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @Length(2, 120)
  name?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(280)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  permissionIds?: number[];
}

export class ReplaceUserRolesDto {
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  roleIds: number[];
}

export class SearchRbacUsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  query?: string;
}

export class RbacIdDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;
}
