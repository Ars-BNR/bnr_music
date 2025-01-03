import { Controller, Get, Param, Query } from '@nestjs/common';
import { AuthorService } from './author.service';

// @UseGuards(JwtAuthGuard)
@Controller('authors')
export class AuthorController {
  constructor(private authorService: AuthorService) {}

  @Get(':id')
  getOne(@Param('id') id: number) {
    return this.authorService.getOne(id);
  }

  @Get()
  getAll(@Query('count') count: number, @Query('offset') offset: number) {
    return this.authorService.getAll(count, offset);
  }
}
