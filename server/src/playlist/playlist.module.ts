import { Module } from '@nestjs/common';
import { PlaylistController } from './playlist.controller';
import { PlaylistService } from './playlist.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { PlaylistModel } from './model/playlist.model';
import { TrackModel } from 'src/track/model/track.model';

@Module({
  imports: [SequelizeModule.forFeature([PlaylistModel, TrackModel])],
  controllers: [PlaylistController],
  providers: [PlaylistService],
})
export class PlaylistModule {}
