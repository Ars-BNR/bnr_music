import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AlbumTrackService } from './album-track.service';
import { CreateAlbumTrackDto } from './dto/create-albumTrack.dto';
import { UpdateAlbumTrackDto } from './dto/update-albumTrack.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('album_track')
export class AlbumTrackController {
  constructor(private albumTrackService: AlbumTrackService) {}

  @Post()
  create(@Body() dto: CreateAlbumTrackDto) {
    return this.albumTrackService.create(dto);
  }

  @Get(':id')
  getOne(@Param('id') id: number) {
    return this.albumTrackService.getOne(id);
  }

  @Delete('delete/:id')
  delete(@Param('id') id: number) {
    return this.albumTrackService.delete(id);
  }

  @Patch('change/:id')
  change(@Param('id') id: number, @Body() updateData: UpdateAlbumTrackDto) {
    return this.albumTrackService.change(id, updateData);
  }
}
