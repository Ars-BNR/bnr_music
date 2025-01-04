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
import { CollectionAlbumService } from './collection-album.service';
import { CreateCollectionAlbumDto } from './dto/create-collectionAlbum.dto';
import { UpdateCollectionAlbumDto } from './dto/update-collectionAlbum.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

// @UseGuards(JwtAuthGuard)
@Controller('collection_album')
export class CollectionAlbumController {
  constructor(private collectionAlbumService: CollectionAlbumService) {}

  @Post()
  create(@Body() dto: CreateCollectionAlbumDto) {
    return this.collectionAlbumService.create(dto);
  }

  @Delete('delete/:id')
  delete(@Param('id') id: number) {
    return this.collectionAlbumService.delete(id);
  }

  @Patch('change/:id')
  change(
    @Param('id') id: number,
    @Body() updateData: UpdateCollectionAlbumDto,
  ) {
    return this.collectionAlbumService.change(id, updateData);
  }

  @Get(':collectionId')
  getAlbumsByCollectionId(
    @Param('collectionId') collectionId: number,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ) {
    return this.collectionAlbumService.getAlbumsByCollectionId(
      collectionId,
      limit,
      offset,
    );
  }
}
