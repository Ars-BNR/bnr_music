import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AlbumFeaturedAuthorModel } from 'src/album-featured-author/model/album-featured-author.model';
import { AlbumTrackModel } from 'src/album-track/model/album-track.model';
import { AlbumModel } from 'src/album/model/album.model';
import { AuthorApplicationModel } from 'src/author-application/model/author-application.model';
import { AuthorModel } from 'src/author/model/author.model';
import { FileModule } from 'src/file/file.module';
import { GenreModel } from 'src/genre/model/genre.model';
import { TrackFeaturedAuthorModel } from 'src/track-featured-author/model/track-featured-author.model';
import { TrackGenreModel } from 'src/track-genre/model/track-genre.model';
import { TrackModel } from 'src/track/model/track.model';
import { UserModel } from 'src/user/model/user.model';
import { CreatorController } from './creator.controller';
import { CreatorService } from './creator.service';

@Module({
  imports: [
    FileModule,
    SequelizeModule.forFeature([
      AuthorApplicationModel,
      AuthorModel,
      UserModel,
      TrackModel,
      AlbumModel,
      GenreModel,
      TrackGenreModel,
      AlbumTrackModel,
      TrackFeaturedAuthorModel,
      AlbumFeaturedAuthorModel,
    ]),
  ],
  controllers: [CreatorController],
  providers: [CreatorService],
})
export class CreatorModule {}
