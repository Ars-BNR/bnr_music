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
import { GenreModel } from 'src/genre/model/genre.model';
import { TrackModel } from 'src/track/model/track.model';

@Table({ tableName: 'track_genres', timestamps: false })
export class TrackGenreModel extends Model {
  @ApiProperty({
    example: 1,
    description: 'Уникальный инкрементный идентификатор',
  })
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => TrackModel)
  @Column(DataType.INTEGER)
  trackId: number;

  @ForeignKey(() => GenreModel)
  @Column(DataType.INTEGER)
  genreId: number;
}
