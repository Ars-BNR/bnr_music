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
import { CollectionAlbumService } from './collection-album.service';
import { CreateCollectionAlbumDto } from './dto/create-collectionAlbum.dto';
import { UpdateCollectionAlbumDto } from './dto/update-collectionAlbum.dto';

type AuthenticatedRequest = Request & { user: AccessTokenPayload };

@Controller('collection_album')
@UseGuards(JwtAuthGuard)
export class CollectionAlbumController {
  constructor(
    private readonly collectionAlbumService: CollectionAlbumService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateCollectionAlbumDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionAlbumService.create(dto, request.user);
  }

  @Delete('delete/:id')
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionAlbumService.delete(id, request.user);
  }

  @Patch('change/:id')
  change(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCollectionAlbumDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionAlbumService.change(id, dto, request.user);
  }

  @Get(':collectionId')
  getAlbumsByCollectionId(
    @Param('collectionId', ParseIntPipe) collectionId: number,
    @Query() pagination: OffsetLimitQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.collectionAlbumService.getAlbumsByCollectionId(
      collectionId,
      request.user,
      pagination.limit,
      pagination.offset,
    );
  }
}
