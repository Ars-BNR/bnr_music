import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CollectionTrackService } from './collection-track.service';
import { CreateCollectionTrackDto } from './dto/create-collectionTrack.dto';

@Controller('collection_track')
export class CollectionTrackController {
  constructor(private collectionTrackService: CollectionTrackService) {}

  @Post()
  create(@Body() dto: CreateCollectionTrackDto) {
    return this.collectionTrackService.create(dto);
  }

  @Delete('delete')
  delete(@Body() dto: CreateCollectionTrackDto) {
    return this.collectionTrackService.delete(dto);
  }

  @Get(':collectionId')
  getTracksByCollectionId(
    @Param('collectionId') collectionId: number,
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ) {
    return this.collectionTrackService.getTracksByCollectionId(
      collectionId,
      limit,
      offset,
    );
  }
}
