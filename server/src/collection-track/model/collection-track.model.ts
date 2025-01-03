import { ApiProperty } from '@nestjs/swagger';
import {
  AutoIncrement,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { CollectionModel } from 'src/collection/model/collection.model';
import { TrackModel } from 'src/track/model/track.model';

@Table({ tableName: 'collection_tracks', timestamps: false })
export class CollectionTrackModel extends Model {
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
    description: 'id трека',
  })
  @ForeignKey(() => TrackModel)
  @Column
  trackId: number;
}
