import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { AuthorService } from './author.service';
import { SearchAuthorsQueryDto } from './dto/search-authors-query.dto';

@Controller('authors')
export class AuthorController {
  constructor(private readonly authorService: AuthorService) {}
  @Get() getAll(@Query() query: SearchAuthorsQueryDto) {
    return this.authorService.getAll(query.count, query.offset, query.query);
  }
  @Get(':id/tracks')
  getTracks(
    @Param('id', ParseIntPipe) id: number,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.authorService.getTracks(
      id,
      pagination.count,
      pagination.offset,
    );
  }
  @Get(':id/albums')
  getAlbums(
    @Param('id', ParseIntPipe) id: number,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.authorService.getAlbums(
      id,
      pagination.count,
      pagination.offset,
    );
  }
  @Get(':id') getOne(@Param('id', ParseIntPipe) id: number) {
    return this.authorService.getOne(id);
  }
}
