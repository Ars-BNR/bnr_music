import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AlbumTrackModel } from 'src/album-track/model/album-track.model';
import { AlbumModel } from 'src/album/model/album.model';
import { TrackModel } from 'src/track/model/track.model';
import tracks from './data/track-seed';
import albums from './data/album-seed';
import album_tracks from './data/album_track-seed';
import { UserModel } from 'src/user/model/user.model';
import users from './data/user-seed';
import { AuthorModel } from 'src/author/model/author.model';
import { GenreModel } from 'src/genre/model/genre.model';
import authors from './data/authors-seed';
import genres from './data/genre-seed';
import { CollectionModel } from 'src/collection/model/collection.model';
import { CollectionAlbumModel } from 'src/collection-album/model/collection-album.model';
import { CollectionTrackModel } from 'src/collection-track/model/collection-track.model';
import { PlaylistModel } from 'src/playlist/model/playlist.model';
import { PlaylistTrackModel } from 'src/playlist-track/model/playlist-track.model';
import collections from './data/collection-seed';
import playlists from './data/playlist-seed';
import playlist_tracks from './data/playlist_track-seed';
import collection_albums from './data/collection_album-seed';
import collection_tracks from './data/collection_track-seed';
import { CollectionPlaylistModel } from 'src/collection-playlist/model/collection-playlist.model';
import collection_playlists from './data/collection_playlist-seed';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(TrackModel) private trackModel: typeof TrackModel,
    @InjectModel(AlbumModel) private albumModel: typeof AlbumModel,
    @InjectModel(UserModel) private userModel: typeof UserModel,
    @InjectModel(AuthorModel) private authorModel: typeof AuthorModel,
    @InjectModel(GenreModel) private genreModel: typeof GenreModel,
    @InjectModel(AlbumTrackModel)
    private albumTrackModel: typeof AlbumTrackModel,
    @InjectModel(CollectionModel)
    private collectionModel: typeof CollectionModel,
    @InjectModel(CollectionAlbumModel)
    private collectionAlbumModel: typeof CollectionAlbumModel,
    @InjectModel(CollectionTrackModel)
    private collectionTrackModel: typeof CollectionTrackModel,
    @InjectModel(PlaylistModel)
    private playlistModel: typeof PlaylistModel,
    @InjectModel(PlaylistTrackModel)
    private playlistTrackModel: typeof PlaylistTrackModel,
    @InjectModel(CollectionPlaylistModel)
    private playlistPlaylistModel: typeof CollectionPlaylistModel,
  ) {}

  private async autoInsert(model: any, seedData: object[]) {
    const count = await model.count();
    if (count === 0) {
      await model.bulkCreate(seedData);
      console.log(`✅ Данные добавлены в ${model.name}`);
    }
  }

  // Функция для запуска всех сидов
  async seed() {
    await this.autoInsert(this.authorModel, authors);
    await this.autoInsert(this.trackModel, tracks);
    await this.autoInsert(this.albumModel, albums);
    await this.autoInsert(this.albumTrackModel, album_tracks);
    await this.autoInsert(this.genreModel, genres);
    await this.autoInsert(this.userModel, users);
    await this.autoInsert(this.collectionModel, collections);
    await this.autoInsert(this.playlistModel, playlists);
    await this.autoInsert(this.playlistTrackModel, playlist_tracks);
    await this.autoInsert(this.collectionAlbumModel, collection_albums);
    await this.autoInsert(this.collectionTrackModel, collection_tracks);
    await this.autoInsert(this.playlistPlaylistModel, collection_playlists);
    console.log('✅ Все сиды успешно добавлены!');
  }
}
