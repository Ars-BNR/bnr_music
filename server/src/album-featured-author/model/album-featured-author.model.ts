import {
  AutoIncrement,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { AlbumModel } from 'src/album/model/album.model';
import { AuthorModel } from 'src/author/model/author.model';

@Table({
  tableName: 'album_featured_authors',
  timestamps: false,
  indexes: [
    {
      name: 'album_featured_authors_album_author_unique',
      unique: true,
      fields: ['albumId', 'authorId'],
    },
    { name: 'album_featured_authors_authorId_idx', fields: ['authorId'] },
  ],
})
export class AlbumFeaturedAuthorModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => AlbumModel)
  @Column(DataType.INTEGER)
  albumId: number;

  @ForeignKey(() => AuthorModel)
  @Column(DataType.INTEGER)
  authorId: number;

  @Column(DataType.SMALLINT)
  position: number;
}
