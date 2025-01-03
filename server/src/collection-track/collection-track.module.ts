import { Module } from '@nestjs/common';
import { CollectionTrackService } from './collection-track.service';
import { CollectionTrackController } from './collection-track.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { CollectionTrackModel } from './model/collection-track.model';

@Module({
  imports: [SequelizeModule.forFeature([CollectionTrackModel])],
  providers: [CollectionTrackService],
  controllers: [CollectionTrackController],
})
export class CollectionTrackModule {}
