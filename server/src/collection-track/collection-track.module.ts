import { Module } from '@nestjs/common';
import { CollectionTrackService } from './collection-track.service';
import { CollectionTrackController } from './collection-track.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { CollectionTrackModel } from './model/collection-track.model';
import { CollectionModel } from 'src/collection/model/collection.model';

@Module({
  imports: [
    SequelizeModule.forFeature([CollectionTrackModel, CollectionModel]),
  ],
  providers: [CollectionTrackService],
  controllers: [CollectionTrackController],
})
export class CollectionTrackModule {}
