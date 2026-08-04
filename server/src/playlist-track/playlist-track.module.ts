import { Module } from '@nestjs/common';
import { PlaylistTrackService } from './playlist-track.service';
import { PlaylistTrackController } from './playlist-track.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { PlaylistTrackModel } from './model/playlist-track.model';

@Module({
  imports: [SequelizeModule.forFeature([PlaylistTrackModel])],
  providers: [PlaylistTrackService],
  controllers: [PlaylistTrackController],
})
export class PlaylistTrackModule {}
