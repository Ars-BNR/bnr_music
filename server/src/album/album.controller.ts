import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AlbumService } from './album.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('albums')
export class AlbumController {
  constructor(private albumService: AlbumService) {}

  @Post()
  create(@Body() dto: CreateAlbumDto) {
    const album = this.albumService.create(dto);
    return album;
  }

  @Get()
  getAll(@Query('count') count: number, @Query('offset') offset: number) {
    return this.albumService.getAll(count, offset);
  }

  @Get(':id')
  getOne(@Param('id') id: number) {
    return this.albumService.getOne(id);
  }

  @Delete("delete/:id")
  delete(@Param("id") id:number){
    return this.albumService.delete(id)
  }

  @Patch("change/:id")
  change(@Param("id") id:number,@Body() updateData:CreateAlbumDto){
    return this.albumService.change(id,updateData)
  }
}
