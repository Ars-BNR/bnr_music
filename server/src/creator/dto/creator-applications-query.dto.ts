import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { AuthorApplicationStatus } from 'src/author-application/model/author-application.model';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

const applicationStatuses: AuthorApplicationStatus[] = [
  'pending',
  'approved',
  'rejected',
];

export class CreatorApplicationsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsIn(applicationStatuses)
  status?: AuthorApplicationStatus;
}
