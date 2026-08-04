import { Module } from '@nestjs/common';
import { GenreService } from './genre.service';
import { GenreController } from './genre.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { GenreModel } from './model/genre.model';
import { TrackModel } from 'src/track/model/track.model';
import { TrackGenreModel } from 'src/track-genre/model/track-genre.model';

@Module({
  imports: [
    SequelizeModule.forFeature([GenreModel, TrackModel, TrackGenreModel]),
  ],
  providers: [GenreService],
  controllers: [GenreController],
})
export class GenreModule {}
