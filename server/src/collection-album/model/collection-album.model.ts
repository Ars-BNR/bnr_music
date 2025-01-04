import { ApiProperty } from '@nestjs/swagger';
import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { AlbumModel } from 'src/album/model/album.model';
import { CollectionModel } from 'src/collection/model/collection.model';

@Table({ tableName: 'collection_albums', timestamps: false })
export class CollectionAlbumModel extends Model {
  @ApiProperty({
    example: 1,
    description: 'Уникальный инкрементный идентификатор',
  })
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ApiProperty({
    example: 1,
    description: 'id коллекции',
  })
  @ForeignKey(() => CollectionModel)
  @Column
  collectionId: number;

  @ApiProperty({
    example: 1,
    description: 'id альбома',
  })
  @ForeignKey(() => AlbumModel)
  @Column
  albumId: number;

  @BelongsTo(() => CollectionModel)
  collection: CollectionModel;

  @BelongsTo(() => AlbumModel)
  album: AlbumModel;
}
