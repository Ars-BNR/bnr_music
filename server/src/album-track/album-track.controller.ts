import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Permissions } from 'src/rbac/permissions.decorator';
import { PermissionsGuard } from 'src/rbac/permissions.guard';
import { AlbumTrackService } from './album-track.service';
import { CreateAlbumTrackDto } from './dto/create-albumTrack.dto';
import { UpdateAlbumTrackDto } from './dto/update-albumTrack.dto';

@Controller('album_track')
@Permissions('catalog.manage')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AlbumTrackController {
  constructor(private readonly albumTrackService: AlbumTrackService) {}
  @Post() create(@Body() dto: CreateAlbumTrackDto) {
    return this.albumTrackService.create(dto);
  }
  @Get(':id') getOne(@Param('id', ParseIntPipe) id: number) {
    return this.albumTrackService.getOne(id);
  }
  @Delete('delete/:id') delete(@Param('id', ParseIntPipe) id: number) {
    return this.albumTrackService.delete(id);
  }
  @Patch('change/:id') change(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAlbumTrackDto,
  ) {
    return this.albumTrackService.change(id, dto);
  }
}
