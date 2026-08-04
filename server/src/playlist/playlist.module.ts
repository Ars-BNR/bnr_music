import { Module } from '@nestjs/common';
import { PlaylistController } from './playlist.controller';
import { PlaylistService } from './playlist.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { PlaylistModel } from './model/playlist.model';
import { TrackModel } from 'src/track/model/track.model';
import { CollectionModel } from 'src/collection/model/collection.model';
import { CollectionPlaylistModel } from 'src/collection-playlist/model/collection-playlist.model';
import { PlaylistTrackModel } from 'src/playlist-track/model/playlist-track.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      PlaylistModel,
      TrackModel,
      CollectionModel,
      CollectionPlaylistModel,
      PlaylistTrackModel,
    ]),
  ],
  controllers: [PlaylistController],
  providers: [PlaylistService],
})
export class PlaylistModule {}
