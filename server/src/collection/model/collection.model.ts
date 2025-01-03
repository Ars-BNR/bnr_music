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
import { AlbumModel } from 'src/album/model/album.model';
import { CollectionAlbumModel } from 'src/collection-album/model/collection-album.model';
import { CollectionPlaylistModel } from 'src/collection-playlist/model/collection-playlist.model';
import { CollectionTrackModel } from 'src/collection-track/model/collection-track.model';
import { PlaylistModel } from 'src/playlist/model/playlist.model';
import { TrackModel } from 'src/track/model/track.model';
import { UserModel } from 'src/user/model/user.model';

@Table({ tableName: 'collections', timestamps: false })
export class CollectionModel extends Model {
  @ApiProperty({
    example: 1,
    description: 'Уникальный инкрементный идентификатор',
  })
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ApiProperty({ example: '1', description: 'Id пользователя' })
  @ForeignKey(() => UserModel)
  @Column(DataType.INTEGER)
  userId: number;

  @BelongsTo(() => UserModel)
  user: UserModel;

  @BelongsToMany(() => PlaylistModel, () => CollectionPlaylistModel)
  playlists: PlaylistModel[];

  @BelongsToMany(() => AlbumModel, () => CollectionAlbumModel)
  albums: AlbumModel[];

  @BelongsToMany(() => TrackModel, () => CollectionTrackModel)
  tracks: TrackModel[];
}
