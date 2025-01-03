import { Controller, Get, Param, Query } from '@nestjs/common';
import { GenreService } from './genre.service';
// / @UseGuards(JwtAuthGuard)
@Controller('genres')
export class GenreController {
  constructor(private genreService: GenreService) {}

  @Get(':id')
  getOne(@Param('id') id: number) {
    return this.genreService.getOne(id);
  }

  @Get()
  getAll(@Query('count') count: number, @Query('offset') offset: number) {
    return this.genreService.getAll(count, offset);
  }
}
