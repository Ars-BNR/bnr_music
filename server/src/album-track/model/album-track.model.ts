import { ApiProperty } from '@nestjs/swagger';
import {
  AutoIncrement,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { AlbumModel } from 'src/album/model/album.model';
import { TrackModel } from 'src/track/model/track.model';

@Table({ tableName: 'album_tracks', timestamps: false })
export class AlbumTrackModel extends Model {
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
    description: 'id альбома',
  })
  @ForeignKey(() => AlbumModel)
  @Column
  albumId: number;

  @ApiProperty({
    example: 1,
    description: 'id трека',
  })
  @ForeignKey(() => TrackModel)
  @Column
  trackId: number;
}
