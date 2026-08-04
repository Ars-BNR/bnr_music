import { Module } from '@nestjs/common';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { CollectionModel } from './model/collection.model';
import { CollectionTrackModel } from 'src/collection-track/model/collection-track.model';
import { CollectionAlbumModel } from 'src/collection-album/model/collection-album.model';
import { CollectionPlaylistModel } from 'src/collection-playlist/model/collection-playlist.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      CollectionModel,
      CollectionTrackModel,
      CollectionAlbumModel,
      CollectionPlaylistModel,
    ]),
  ],
  controllers: [CollectionController],
  providers: [CollectionService],
  exports: [CollectionService],
})
export class CollectionModule {}
