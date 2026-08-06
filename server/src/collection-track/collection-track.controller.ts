import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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
import { CreateCollectionTrackDto } from './dto/create-collectionTrack.dto';
import { CollectionTrackService } from './collection-track.service';

type AuthenticatedRequest = Request & { user: AccessTokenPayload };

@Controller('collection_track')
@Permissions('library.manage-own')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CollectionTrackController {
  constructor(
    private readonly collectionTrackService: CollectionTrackService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateCollectionTrackDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionTrackService.create(dto, request.user);
  }

  @Delete('delete')
  delete(
    @Body() dto: CreateCollectionTrackDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionTrackService.delete(dto, request.user);
  }

  @Get(':collectionId')
  getTracksByCollectionId(
    @Param('collectionId', ParseIntPipe) collectionId: number,
    @Query() pagination: OffsetLimitQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionTrackService.getTracksByCollectionId(
      collectionId,
      request.user,
      pagination.limit,
      pagination.offset,
    );
  }
}
