import { Module } from '@nestjs/common';
import { TrackService } from './track.service';
import { TrackController } from './track.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { TrackModel } from './model/track.model';
import { AuthorModel } from 'src/author/model/author.model';
import { FileModule } from 'src/file/file.module';

@Module({
  imports: [FileModule, SequelizeModule.forFeature([TrackModel, AuthorModel])],
  providers: [TrackService],
  controllers: [TrackController],
})
export class TrackModule {}
