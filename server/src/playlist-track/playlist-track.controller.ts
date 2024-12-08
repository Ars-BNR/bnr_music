import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PlaylistTrackService } from './playlist-track.service';
import { CreatePlaylistTrackDto } from './dto/create-playlistTrack.dto';
import { UpdatePlaylistTrackDto } from './dto/update-playlistTrack.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('playlist_track')
export class PlaylistTrackController {
  constructor(private playlistTrackService: PlaylistTrackService) {}

  @Post()
  create(@Body() dto: CreatePlaylistTrackDto) {
    return this.playlistTrackService.create(dto);
  }

  @Delete('delete/:id')
  delete(@Param('id') id: number) {
    return this.playlistTrackService.delete(id);
  }

  @Patch('change/:id')
  change(@Param('id') id: number, @Body() updateData: UpdatePlaylistTrackDto) {
    return this.playlistTrackService.change(id, updateData);
  }
}
