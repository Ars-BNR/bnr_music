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
import { CollectionModel } from 'src/collection/model/collection.model';
import { PlaylistModel } from 'src/playlist/model/playlist.model';

@Table({ tableName: 'collection_playlists', timestamps: false })
export class CollectionPlaylistModel extends Model {
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
    description: 'id плейлиста',
  })
  @ForeignKey(() => PlaylistModel)
  @Column
  playlistId: number;

  @BelongsTo(() => CollectionModel)
  collection: CollectionModel;

  @BelongsTo(() => PlaylistModel)
  playlist: PlaylistModel;
}
