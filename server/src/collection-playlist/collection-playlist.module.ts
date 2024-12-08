import { Module } from '@nestjs/common';
import { CollectionPlaylistController } from './collection-playlist.controller';
import { CollectionPlaylistService } from './collection-playlist.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { CollectionPlaylistModel } from './model/collection-playlist.model';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [SequelizeModule.forFeature([CollectionPlaylistModel])],
  controllers: [CollectionPlaylistController],
  providers: [CollectionPlaylistService,JwtService],
})
export class CollectionPlaylistModule {}
