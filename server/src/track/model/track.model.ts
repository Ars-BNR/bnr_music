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
import { AlbumModel } from 'src/album/model/album.model';
import { AuthorModel } from 'src/author/model/author.model';
import { CollectionTrackModel } from 'src/collection-track/model/collection-track.model';
import { CollectionModel } from 'src/collection/model/collection.model';
import { GenreModel } from 'src/genre/model/genre.model';
import { PlaylistTrackModel } from 'src/playlist-track/model/playlist-track.model';
import { PlaylistModel } from 'src/playlist/model/playlist.model';
import { TrackGenreModel } from 'src/track-genre/model/track-genre.model';

@Table({ tableName: 'tracks', timestamps: false })
export class TrackModel extends Model {
  @ApiProperty({
    example: 1,
    description: 'Уникальный инкрементный идентификатор',
  })
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ApiProperty({ example: 'Escape', description: 'Название трека' })
  @Column(DataType.STRING)
  name: string;

  @ApiProperty({
    example: 'gfsaswq',
    description: 'путь до картинки(только ее название)',
  })
  @Column(DataType.STRING)
  picture: string;

  @ApiProperty({
    example: 'something text music',
    description: 'текст песни',
  })
  @Column(DataType.STRING)
  text: string;

  @ApiProperty({
    example: '1',
    description: 'количество прослушиваний',
  })
  @Column(DataType.INTEGER)
  listens: number;

  @ApiProperty({
    example: '1',
    description: 'количество прослушиваний',
  })
  @Column(DataType.STRING)
  audio: string;

  @ForeignKey(() => AuthorModel)
  @ApiProperty({ example: 1, description: 'ID автора трека' })
  @Column(DataType.INTEGER)
  authorId: number;

  @BelongsTo(() => AuthorModel)
  author: AuthorModel;

  @BelongsToMany(() => PlaylistModel, () => PlaylistTrackModel)
  playlists: PlaylistModel[];

  @BelongsToMany(() => AlbumModel, () => AlbumTrackModel)
  albums: AlbumModel[];

  @BelongsToMany(() => GenreModel, () => TrackGenreModel)
  genres: GenreModel[];
}
