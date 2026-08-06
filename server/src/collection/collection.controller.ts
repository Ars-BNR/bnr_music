import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AccessTokenPayload } from 'src/auth/jwt.strategy';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Permissions } from 'src/rbac/permissions.decorator';
import { PermissionsGuard } from 'src/rbac/permissions.guard';
import { CollectionService } from './collection.service';

type AuthenticatedRequest = Request & { user: AccessTokenPayload };

@Controller('collection')
@Permissions('library.manage-own')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Post()
  create(@Req() request: AuthenticatedRequest) {
    return this.collectionService.createForUser(request.user.sub);
  }

  @Get()
  @Permissions('users.read')
  @UseGuards(PermissionsGuard)
  getAll(@Query() pagination: PaginationQueryDto) {
    return this.collectionService.getAll(pagination.count, pagination.offset);
  }

  @Get('user/:userId')
  getByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionService.getByUserId(userId, request.user);
  }

  @Get('summary/:userId')
  getCollectionSummary(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionService.getCollectionSummary(userId, request.user);
  }

  @Get('me/summary')
  getCurrentUserSummary(@Req() request: AuthenticatedRequest) {
    return this.collectionService.getCurrentCollectionSummary(request.user.sub);
  }

  @Get('me/albums')
  getCurrentUserAlbums(
    @Query() pagination: PaginationQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionService.getCurrentUserAlbums(
      request.user.sub,
      pagination.count,
      pagination.offset,
    );
  }

  @Get('me/albums/:albumId/status')
  getCurrentUserAlbumStatus(
    @Param('albumId', ParseIntPipe) albumId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionService.getCurrentUserAlbumStatus(
      request.user.sub,
      albumId,
    );
  }

  @Get('me/tracks')
  getCurrentUserTracks(
    @Query() pagination: PaginationQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionService.getCurrentUserTracks(
      request.user.sub,
      pagination.count,
      pagination.offset,
    );
  }

  @Get('me/tracks/:trackId/status')
  getCurrentUserTrackStatus(
    @Param('trackId', ParseIntPipe) trackId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionService.getCurrentUserTrackStatus(
      request.user.sub,
      trackId,
    );
  }

  @Put('me/tracks/:trackId')
  setCurrentUserTrack(
    @Param('trackId', ParseIntPipe) trackId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionService.setCurrentUserTrack(
      request.user.sub,
      trackId,
    );
  }

  @Delete('me/tracks/:trackId')
  removeCurrentUserTrack(
    @Param('trackId', ParseIntPipe) trackId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionService.removeCurrentUserTrack(
      request.user.sub,
      trackId,
    );
  }

  @Put('me/albums/:albumId')
  setCurrentUserAlbum(
    @Param('albumId', ParseIntPipe) albumId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionService.setCurrentUserAlbum(
      request.user.sub,
      albumId,
    );
  }

  @Delete('me/albums/:albumId')
  removeCurrentUserAlbum(
    @Param('albumId', ParseIntPipe) albumId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionService.removeCurrentUserAlbum(
      request.user.sub,
      albumId,
    );
  }

  @Get(':id')
  getOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionService.getOne(id, request.user);
  }

  @Delete('delete/:id')
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionService.delete(id, request.user);
  }
}
