import { Module } from '@nestjs/common';
import { GenreService } from './genre.service';
import { GenreController } from './genre.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { GenreModel } from './model/genre.model';
import { TrackModel } from 'src/track/model/track.model';

@Module({
  imports: [SequelizeModule.forFeature([GenreModel, TrackModel])],
  providers: [GenreService],
  controllers: [GenreController],
})
export class GenreModule {}
