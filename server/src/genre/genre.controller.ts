import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { GenreService } from './genre.service';

@Controller('genres')
export class GenreController {
  constructor(private readonly genreService: GenreService) {}
  @Get() getAll(@Query() pagination: PaginationQueryDto) {
    return this.genreService.getAll(pagination.count, pagination.offset);
  }
  @Get(':id') getOne(@Param('id', ParseIntPipe) id: number) {
    return this.genreService.getOne(id);
  }
}
