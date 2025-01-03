import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { CollectionTrackService } from './collection-track.service';
import { CreateCollectionTrackDto } from './dto/create-collectionTrack.dto';

@Controller('collection_track')
export class CollectionTrackController {
  constructor(private collectionTrackService: CollectionTrackService) {}

  @Post()
  create(@Body() dto: CreateCollectionTrackDto) {
    return this.collectionTrackService.create(dto);
  }

  @Delete('delete/:id')
  delete(@Param('id') id: number) {
    return this.collectionTrackService.delete(id);
  }
}
