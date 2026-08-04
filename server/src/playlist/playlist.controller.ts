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
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { PlaylistTrackDto } from './dto/playlist-track.dto';
import { PlaylistService } from './playlist.service';

type AuthenticatedRequest = Request & { user: AccessTokenPayload };

@Controller('playlist')
@UseGuards(JwtAuthGuard)
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Post()
  create(@Body() dto: CreatePlaylistDto, @Req() request: AuthenticatedRequest) {
    return this.playlistService.create(dto, request.user);
  }

  @Get()
  getAll(
    @Query() pagination: PaginationQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.playlistService.getAll(
      request.user,
      pagination.count,
      pagination.offset,
    );
  }

  @Get('mine')
  getMine(
    @Query() pagination: PaginationQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.playlistService.getMine(
      request.user,
      pagination.count,
      pagination.offset,
    );
  }

  @Get(':id')
  getOne(
    @Param('id', ParseIntPipe) id: number,
    @Query() pagination: PaginationQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.playlistService.getOne(
      id,
      request.user,
      pagination.count,
      pagination.offset,
    );
  }

  @Post(':id/tracks')
  addTrack(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PlaylistTrackDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.playlistService.addTrack(id, dto.trackId, request.user);
  }

  @Delete(':id/tracks/:trackId')
  removeTrack(
    @Param('id', ParseIntPipe) id: number,
    @Param('trackId', ParseIntPipe) trackId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.playlistService.removeTrack(id, trackId, request.user);
  }

  @Delete('delete/:id')
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.playlistService.delete(id, request.user);
  }

  @Patch('change/:id')
  change(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlaylistDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.playlistService.change(id, dto, request.user);
  }
}
