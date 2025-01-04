import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { TrackModel } from 'src/track/model/track.model';
import { AlbumModel } from 'src/album/model/album.model';
import { AlbumTrackModel } from 'src/album-track/model/album-track.model';
import { UserModel } from 'src/user/model/user.model';
import { AuthorModel } from 'src/author/model/author.model';
import { GenreModel } from 'src/genre/model/genre.model';
import { PlaylistModel } from 'src/playlist/model/playlist.model';
import { CollectionModel } from 'src/collection/model/collection.model';
import { CollectionAlbumModel } from 'src/collection-album/model/collection-album.model';
import { CollectionTrackModel } from 'src/collection-track/model/collection-track.model';
import { PlaylistTrackModel } from 'src/playlist-track/model/playlist-track.model';
import { CollectionPlaylistModel } from 'src/collection-playlist/model/collection-playlist.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      TrackModel,
      AlbumModel,
      AlbumTrackModel,
      UserModel,
      AuthorModel,
      GenreModel,
      PlaylistModel,
      CollectionModel,
      CollectionAlbumModel,
      CollectionTrackModel,
      CollectionPlaylistModel,
      PlaylistTrackModel,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
