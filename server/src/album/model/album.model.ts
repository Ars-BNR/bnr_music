import { ApiProperty } from '@nestjs/swagger';
import {
  AutoIncrement,
  AllowNull,
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
import { CollectionAlbumModel } from 'src/collection-album/model/collection-album.model';
import { CollectionModel } from 'src/collection/model/collection.model';
import { TrackModel } from 'src/track/model/track.model';
import { AlbumFeaturedAuthorModel } from 'src/album-featured-author/model/album-featured-author.model';

@Table({
  tableName: 'albums',
  timestamps: false,
  indexes: [
    {
      name: 'albums_author_creator_request_unique',
      unique: true,
      fields: ['authorId', 'creatorRequestId'],
    },
  ],
})
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
    example: 'gfsaswq.jpg',
    description: 'путь до картинки(только ее название)',
  })
  @Column(DataType.STRING)
  picture: string;

  @ApiProperty({
    example: 1000,
    description: 'Количество прослушиваний альбома',
  })
  @Column(DataType.INTEGER)
  listens: number;

  @ForeignKey(() => AuthorModel)
  @Column(DataType.INTEGER)
  authorId: number;

  @AllowNull
  @Column(DataType.UUID)
  creatorRequestId: string | null;

  @BelongsTo(() => AuthorModel)
  author: AuthorModel;

  @BelongsToMany(() => TrackModel, () => AlbumTrackModel)
  tracks: TrackModel[];

  @BelongsToMany(() => CollectionModel, () => CollectionAlbumModel)
  collections: CollectionModel[];

  @BelongsToMany(
    () => AuthorModel,
    () => AlbumFeaturedAuthorModel,
    'albumId',
    'authorId',
  )
  featuredAuthors: AuthorModel[];
}
