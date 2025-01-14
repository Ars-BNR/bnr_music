import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

// @UseGuards(JwtAuthGuard)
@Controller('playlist')
export class PlaylistController {
  constructor(private playlistService: PlaylistService) {}

  @Post()
  create(@Body() dto: CreatePlaylistDto) {
    return this.playlistService.create(dto);
  }

  @Get()
  getAll(@Query('count') count: number, @Query('offset') offset: number) {
    return this.playlistService.getAll(count, offset);
  }

  @Get(':id')
  getOne(@Param('id') id: number) {
    return this.playlistService.getOne(id);
  }

  @Delete('delete/:id')
  delete(@Param('id') id: number) {
    return this.playlistService.delete(id);
  }

  @Patch('change/:id')
  change(@Param('id') id: number, @Body() updateData: UpdatePlaylistDto) {
    return this.playlistService.change(id, updateData);
  }
}
