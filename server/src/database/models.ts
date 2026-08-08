import { AlbumModel } from 'src/album/model/album.model';
import { AlbumFeaturedAuthorModel } from 'src/album-featured-author/model/album-featured-author.model';
import { AlbumTrackModel } from 'src/album-track/model/album-track.model';
import { AuthorModel } from 'src/author/model/author.model';
import { AuthorApplicationModel } from 'src/author-application/model/author-application.model';
import { CollectionModel } from 'src/collection/model/collection.model';
import { CollectionAlbumModel } from 'src/collection-album/model/collection-album.model';
import { CollectionPlaylistModel } from 'src/collection-playlist/model/collection-playlist.model';
import { CollectionTrackModel } from 'src/collection-track/model/collection-track.model';
import { GenreModel } from 'src/genre/model/genre.model';
import { PlaylistModel } from 'src/playlist/model/playlist.model';
import { PlaylistTrackModel } from 'src/playlist-track/model/playlist-track.model';
import { TokenModel } from 'src/token/model/token.model';
import { TrackModel } from 'src/track/model/track.model';
import { TrackGenreModel } from 'src/track-genre/model/track-genre.model';
import { TrackFeaturedAuthorModel } from 'src/track-featured-author/model/track-featured-author.model';
import { UserModel } from 'src/user/model/user.model';
import { PasswordResetTokenModel } from 'src/user/model/password-reset-token.model';
import { PermissionModel } from 'src/rbac/model/permission.model';
import { RolePermissionModel } from 'src/rbac/model/role-permission.model';
import { RoleModel } from 'src/rbac/model/role.model';
import { UserRoleModel } from 'src/rbac/model/user-role.model';
import { PlayEventModel } from 'src/analytics/model/play-event.model';

export const databaseModels = [
  UserModel,
  PasswordResetTokenModel,
  TokenModel,
  PlaylistModel,
  TrackModel,
  AlbumModel,
  CollectionModel,
  PlaylistTrackModel,
  AlbumTrackModel,
  CollectionPlaylistModel,
  CollectionAlbumModel,
  AuthorModel,
  GenreModel,
  TrackGenreModel,
  CollectionTrackModel,
  AuthorApplicationModel,
  TrackFeaturedAuthorModel,
  AlbumFeaturedAuthorModel,
  RoleModel,
  PermissionModel,
  UserRoleModel,
  RolePermissionModel,
  PlayEventModel,
];

export const databaseTables = [
  'users',
  'tokens',
  'playlists',
  'tracks',
  'albums',
  'collections',
  'playlist_tracks',
  'album_tracks',
  'collection_playlists',
  'collection_albums',
  'authors',
  'genres',
  'track_genres',
  'collection_tracks',
];
