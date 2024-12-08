import { ApiProperty } from '@nestjs/swagger';
import {
  AutoIncrement,
  BelongsToMany,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { AlbumTrackModel } from 'src/album-track/model/album-track.model';
import { TrackModel } from 'src/track/model/track.model';

@Table({ tableName: 'albums', timestamps: false })
export class AlbumModel extends Model {
  @ApiProperty({
    example: 1,
    description: 'Уникальный инкрементный идентификатор',
  })
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ApiProperty({
    example: 'Assassins Creed II',
    description: 'Название альбома',
  })
  @Column(DataType.STRING)
  name: string;

  @BelongsToMany(() => TrackModel, () => AlbumTrackModel)
  tracks: TrackModel[];
}
