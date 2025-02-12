import { Module } from '@nestjs/common';
import { AuthorController } from './author.controller';
import { AuthorService } from './author.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthorModel } from './model/author.model';
import { TrackModel } from 'src/track/model/track.model';

@Module({
  imports: [SequelizeModule.forFeature([AuthorModel, TrackModel])],
  controllers: [AuthorController],
  providers: [AuthorService],
})
export class AuthorModule {}
