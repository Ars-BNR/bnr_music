import { Module } from '@nestjs/common';
import { CollectionPlaylistController } from './collection-playlist.controller';
import { CollectionPlaylistService } from './collection-playlist.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { CollectionPlaylistModel } from './model/collection-playlist.model';

@Module({
  imports: [SequelizeModule.forFeature([CollectionPlaylistModel])],
  controllers: [CollectionPlaylistController],
  providers: [CollectionPlaylistService],
})
export class CollectionPlaylistModule {}
