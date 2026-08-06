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
import { Permissions } from 'src/rbac/permissions.decorator';
import { PermissionsGuard } from 'src/rbac/permissions.guard';
import { CollectionPlaylistService } from './collection-playlist.service';
import { CreateCollectionPlaylistDto } from './dto/create-collectionPlaylist.dto';
import { UpdateCollectionPlaylistDto } from './dto/update-collectionPlaylist.dto';

type AuthenticatedRequest = Request & { user: AccessTokenPayload };

@Controller('collection_playlist')
@Permissions('library.manage-own')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CollectionPlaylistController {
  constructor(
    private readonly collectionPlaylistService: CollectionPlaylistService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateCollectionPlaylistDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionPlaylistService.create(dto, request.user);
  }
  @Delete('delete/:id')
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionPlaylistService.delete(id, request.user);
  }
  @Patch('change/:id')
  change(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCollectionPlaylistDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionPlaylistService.change(id, dto, request.user);
  }
  @Get(':collectionId')
  getPlaylistsByCollectionId(
    @Param('collectionId', ParseIntPipe) collectionId: number,
    @Query() pagination: OffsetLimitQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionPlaylistService.getPlaylistsByCollectionId(
      collectionId,
      request.user,
      pagination.limit,
      pagination.offset,
    );
  }
}
