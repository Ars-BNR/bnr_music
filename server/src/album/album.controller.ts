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
import { Roles } from 'src/decorators/roles-auth.decorator';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { CreateAlbumDto } from './dto/create-album.dto';
import { AlbumService } from './album.service';

@Controller('albums')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @Post()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
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

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.albumService.getOne(id);
  }

  @Delete('delete/:id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.albumService.delete(id);
  }

  @Patch('change/:id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  change(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateAlbumDto) {
    return this.albumService.change(id, dto);
  }
}
