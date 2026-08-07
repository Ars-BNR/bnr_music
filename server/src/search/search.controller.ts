import { Controller, Get, Param, ParseEnumPipe, Query } from '@nestjs/common';
import {
  SearchPageQueryDto,
  SearchPreviewQueryDto,
  SearchType,
} from './dto/search-query.dto';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  preview(@Query() query: SearchPreviewQueryDto) {
    return this.searchService.preview(query.query, query.count);
  }

  @Get(':type')
  searchType(
    @Param('type', new ParseEnumPipe(SearchType)) type: SearchType,
    @Query() query: SearchPageQueryDto,
  ) {
    return this.searchService.searchType(
      type,
      query.query,
      query.count,
      query.offset,
    );
  }
}
