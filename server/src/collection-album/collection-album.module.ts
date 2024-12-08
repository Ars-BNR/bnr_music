import { Module } from '@nestjs/common';
import { CollectionAlbumController } from './collection-album.controller';
import { CollectionAlbumService } from './collection-album.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { CollectionAlbumModel } from './model/collection-album.model';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [SequelizeModule.forFeature([CollectionAlbumModel])],
  controllers: [CollectionAlbumController],
  providers: [CollectionAlbumService,JwtService],
})
export class CollectionAlbumModule {}
