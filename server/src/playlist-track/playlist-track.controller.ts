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
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AccessTokenPayload } from 'src/auth/jwt.strategy';
import { OffsetLimitQueryDto } from 'src/common/dto/offset-limit-query.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CreatePlaylistTrackDto } from './dto/create-playlistTrack.dto';
import { UpdatePlaylistTrackDto } from './dto/update-playlistTrack.dto';
import { PlaylistTrackService } from './playlist-track.service';

type AuthenticatedRequest = Request & { user: AccessTokenPayload };

@Controller('playlist_track')
@UseGuards(JwtAuthGuard)
export class PlaylistTrackController {
  constructor(private readonly playlistTrackService: PlaylistTrackService) {}
  @Post()
  create(
    @Body() dto: CreatePlaylistTrackDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.playlistTrackService.create(dto, request.user);
  }
  @Delete('delete/:id')
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.playlistTrackService.delete(id, request.user);
  }
  @Patch('change/:id')
  change(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlaylistTrackDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.playlistTrackService.change(id, dto, request.user);
  }
  @Get('playlist/:id')
  getTracksByPlaylistId(
    @Param('id', ParseIntPipe) id: number,
    @Query() pagination: OffsetLimitQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.playlistTrackService.getTracksByPlaylistId(
      id,
      request.user,
      pagination.limit,
      pagination.offset,
    );
  }
}
