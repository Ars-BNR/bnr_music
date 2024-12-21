import { ApiProperty } from '@nestjs/swagger';
import {
  AutoIncrement,
  Column,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { AlbumModel } from 'src/album/model/album.model';
import { TrackModel } from 'src/track/model/track.model';

@Table({ tableName: 'authors', timestamps: false })
export class AuthorModel extends Model {
  @ApiProperty({
    example: 1,
    description: 'Уникальный инкрементный идентификатор',
  })
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ApiProperty({
    example: 'John Doe',
    description: 'Имя автора',
  })
  @Column(DataType.STRING)
  name: string;

  @HasMany(() => AlbumModel)
  albums: AlbumModel[];

  @HasMany(() => TrackModel)
  tracks: TrackModel[];
}
