import {
  AllowNull,
  AutoIncrement,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import { TrackModel } from 'src/track/model/track.model';

@Table({ tableName: 'play_events', timestamps: false })
export class PlayEventModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.UUID)
  playbackId: string;

  @ForeignKey(() => TrackModel)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  trackId: number;

  @AllowNull(false)
  @Column(DataType.DATE)
  playedAt: Date;
}
