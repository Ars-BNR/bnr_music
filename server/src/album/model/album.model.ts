import { ApiProperty } from '@nestjs/swagger';
import {
  AutoIncrement,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { AlbumTrackModel } from 'src/album-track/model/album-track.model';
import { AuthorModel } from 'src/author/model/author.model';
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

  @ApiProperty({
    example: 1000,
    description: 'Количество прослушиваний альбома',
  })
  @Column(DataType.INTEGER)
  listens: number;

  @ForeignKey(() => AuthorModel)
  @Column(DataType.INTEGER)
  authorId: number;

  @BelongsTo(() => AuthorModel)
  author: AuthorModel;

  @BelongsToMany(() => TrackModel, () => AlbumTrackModel)
  tracks: TrackModel[];
}
