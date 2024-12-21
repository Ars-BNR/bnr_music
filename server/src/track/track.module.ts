import { Module } from '@nestjs/common';
import { TrackService } from './track.service';
import { TrackController } from './track.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { TrackModel } from './model/track.model';
import { FileService } from 'src/file/file.service';
import { JwtService } from '@nestjs/jwt';
import { AuthorModel } from 'src/author/model/author.model';

@Module({
  imports: [SequelizeModule.forFeature([TrackModel, AuthorModel])],
  providers: [TrackService, FileService, JwtService],
  controllers: [TrackController],
})
export class TrackModule {}
