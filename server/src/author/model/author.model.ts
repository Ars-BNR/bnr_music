import { ApiProperty } from '@nestjs/swagger';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import { AlbumModel } from 'src/album/model/album.model';
import { TrackModel } from 'src/track/model/track.model';
import { UserModel } from 'src/user/model/user.model';

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

  @ForeignKey(() => UserModel)
  @AllowNull
  @Unique
  @Column(DataType.INTEGER)
  userId: number | null;

  @Default('')
  @Column(DataType.STRING(500))
  bio: string;

  @AllowNull
  @Column(DataType.STRING)
  avatar: string | null;

  @BelongsTo(() => UserModel)
  user: UserModel;

  @HasMany(() => AlbumModel)
  albums: AlbumModel[];

  @HasMany(() => TrackModel)
  tracks: TrackModel[];
}
