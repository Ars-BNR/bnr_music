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
import { PlaylistModel } from 'src/playlist/model/playlist.model';
import { TrackModel } from 'src/track/model/track.model';

@Table({ tableName: 'playlist_tracks', timestamps: false })
export class PlaylistTrackModel extends Model {
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
    description: 'id плейлиста',
  })
  @ForeignKey(() => PlaylistModel)
  @Column
  playlistId: number;

  @ApiProperty({
    example: 1,
    description: 'id трека',
  })
  @ForeignKey(() => TrackModel)
  @Column
  trackId?: number;

  @BelongsTo(() => TrackModel)
  track: TrackModel;

  // Ассоциация с моделью PlaylistModel
  @BelongsTo(() => PlaylistModel)
  playlist: PlaylistModel;
}
