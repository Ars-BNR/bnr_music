import {
  AutoIncrement,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { AuthorModel } from 'src/author/model/author.model';
import { TrackModel } from 'src/track/model/track.model';

@Table({
  tableName: 'track_featured_authors',
  timestamps: false,
  indexes: [
    {
      name: 'track_featured_authors_track_author_unique',
      unique: true,
      fields: ['trackId', 'authorId'],
    },
    { name: 'track_featured_authors_authorId_idx', fields: ['authorId'] },
  ],
})
export class TrackFeaturedAuthorModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => TrackModel)
  @Column(DataType.INTEGER)
  trackId: number;

  @ForeignKey(() => AuthorModel)
  @Column(DataType.INTEGER)
  authorId: number;

  @Column(DataType.SMALLINT)
  position: number;
}
