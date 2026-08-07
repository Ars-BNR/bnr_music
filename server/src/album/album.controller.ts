import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Permissions } from 'src/rbac/permissions.decorator';
import { PermissionsGuard } from 'src/rbac/permissions.guard';
import { AlbumCatalogQueryDto } from './dto/album-catalog-query.dto';
import { CreateAlbumDto } from './dto/create-album.dto';
import { AlbumService } from './album.service';

@Controller('albums')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @Post()
  @Permissions('catalog.manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  create(@Body() dto: CreateAlbumDto) {
    return this.albumService.create(dto);
  }

  @Get()
  getAll(@Query() pagination: PaginationQueryDto) {
    return this.albumService.getAll(pagination.count, pagination.offset);
  }

  @Get('popular')
  getTopAlbums(@Query() pagination: PaginationQueryDto) {
    return this.albumService.getTopAlbum(pagination.count, pagination.offset);
  }

  @Get('catalog')
  getCatalog(@Query() query: AlbumCatalogQueryDto) {
    return this.albumService.getCatalog(query.count, query.offset, query.query);
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.albumService.getOne(id);
  }

  @Delete('delete/:id')
  @Permissions('catalog.manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.albumService.delete(id);
  }

  @Patch('change/:id')
  @Permissions('catalog.manage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  change(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateAlbumDto) {
    return this.albumService.change(id, dto);
  }
}
