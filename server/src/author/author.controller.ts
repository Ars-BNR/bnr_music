import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { AuthorService } from './author.service';

@Controller('authors')
export class AuthorController {
  constructor(private readonly authorService: AuthorService) {}
  @Get() getAll(@Query() pagination: PaginationQueryDto) {
    return this.authorService.getAll(pagination.count, pagination.offset);
  }
  @Get(':id') getOne(@Param('id', ParseIntPipe) id: number) {
    return this.authorService.getOne(id);
  }
}
