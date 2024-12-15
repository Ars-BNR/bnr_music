import { Module } from '@nestjs/common';
import { TrackGenreService } from './track-genre.service';
import { TrackGenreController } from './track-genre.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { TrackGenreModel } from './model/track-genre.model';

@Module({
  imports: [SequelizeModule.forFeature([TrackGenreModel])],
  providers: [TrackGenreService],
  controllers: [TrackGenreController],
})
export class TrackGenreModule {}
