import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AlbumModel } from 'src/album/model/album.model';
import { AuthorModel } from 'src/author/model/author.model';
import { GenreModel } from 'src/genre/model/genre.model';
import { PlaylistModel } from 'src/playlist/model/playlist.model';
import { PlaylistTrackModel } from 'src/playlist-track/model/playlist-track.model';
import { TrackModel } from 'src/track/model/track.model';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      TrackModel,
      AuthorModel,
      AlbumModel,
      GenreModel,
      PlaylistModel,
      PlaylistTrackModel,
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
