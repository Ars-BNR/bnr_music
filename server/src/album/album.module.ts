import { Module } from '@nestjs/common';
import { AlbumController } from './album.controller';
import { AlbumService } from './album.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { AlbumModel } from './model/album.model';
import { TrackModel } from 'src/track/model/track.model';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [SequelizeModule.forFeature([AlbumModel,TrackModel])],
  controllers: [AlbumController],
  providers: [AlbumService,JwtService],
})
export class AlbumModule {}
