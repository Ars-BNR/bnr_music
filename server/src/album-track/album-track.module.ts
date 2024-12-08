import { Module } from '@nestjs/common';
import { AlbumTrackController } from './album-track.controller';
import { AlbumTrackService } from './album-track.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { AlbumTrackModel } from './model/album-track.model';
import { AlbumModel } from 'src/album/model/album.model';
import { TrackModel } from 'src/track/model/track.model';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [SequelizeModule.forFeature([AlbumTrackModel,AlbumModel, TrackModel])],
  controllers: [AlbumTrackController],
  providers: [AlbumTrackService,JwtService],
})
export class AlbumTrackModule {}
