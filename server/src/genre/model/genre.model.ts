import { ApiProperty } from '@nestjs/swagger';
import {
  AutoIncrement,
  Column,
  DataType,
  BelongsToMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { TrackGenreModel } from 'src/track-genre/model/track-genre.model';
import { TrackModel } from 'src/track/model/track.model';

@Table({ tableName: 'genres', timestamps: false })
export class GenreModel extends Model {
  @ApiProperty({
    example: 1,
    description: 'Уникальный инкрементный идентификатор',
  })
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ApiProperty({ example: 'Rock', description: 'Название жанра' })
  @Column(DataType.STRING)
  name: string;

  @BelongsToMany(() => TrackModel, () => TrackGenreModel)
  tracks: TrackModel[];
}
