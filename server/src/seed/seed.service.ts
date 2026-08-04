import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { AlbumTrackModel } from 'src/album-track/model/album-track.model';
import { AlbumModel } from 'src/album/model/album.model';
import { AuthorModel } from 'src/author/model/author.model';
import { CollectionModel } from 'src/collection/model/collection.model';
import { CollectionAlbumModel } from 'src/collection-album/model/collection-album.model';
import { CollectionPlaylistModel } from 'src/collection-playlist/model/collection-playlist.model';
import { CollectionTrackModel } from 'src/collection-track/model/collection-track.model';
import { GenreModel } from 'src/genre/model/genre.model';
import { PlaylistModel } from 'src/playlist/model/playlist.model';
import { PlaylistTrackModel } from 'src/playlist-track/model/playlist-track.model';
import { TrackModel } from 'src/track/model/track.model';
import { TrackGenreModel } from 'src/track-genre/model/track-genre.model';
import { UserModel } from 'src/user/model/user.model';
import albumTracks from './data/album_track-seed';
import albums from './data/album-seed';
import authors from './data/authors-seed';
import collectionAlbums from './data/collection_album-seed';
import collectionPlaylists from './data/collection_playlist-seed';
import collectionTracks from './data/collection_track-seed';
import collections from './data/collection-seed';
import genres from './data/genre-seed';
import playlists from './data/playlist-seed';
import playlistTracks from './data/playlist_track-seed';
import tracks from './data/track-seed';
import trackGenres from './data/track-genre-seed';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(TrackModel) private readonly trackModel: typeof TrackModel,
    @InjectModel(AlbumModel) private readonly albumModel: typeof AlbumModel,
    @InjectModel(UserModel) private readonly userModel: typeof UserModel,
    @InjectModel(AuthorModel) private readonly authorModel: typeof AuthorModel,
    @InjectModel(GenreModel) private readonly genreModel: typeof GenreModel,
    @InjectModel(TrackGenreModel)
    private readonly trackGenreModel: typeof TrackGenreModel,
    @InjectModel(AlbumTrackModel)
    private readonly albumTrackModel: typeof AlbumTrackModel,
    @InjectModel(CollectionModel)
    private readonly collectionModel: typeof CollectionModel,
    @InjectModel(CollectionAlbumModel)
    private readonly collectionAlbumModel: typeof CollectionAlbumModel,
    @InjectModel(CollectionTrackModel)
    private readonly collectionTrackModel: typeof CollectionTrackModel,
    @InjectModel(PlaylistModel)
    private readonly playlistModel: typeof PlaylistModel,
    @InjectModel(PlaylistTrackModel)
    private readonly playlistTrackModel: typeof PlaylistTrackModel,
    @InjectModel(CollectionPlaylistModel)
    private readonly collectionPlaylistModel: typeof CollectionPlaylistModel,
    private readonly config: ConfigService,
  ) {}

  private async insertWhenEmpty(
    model: {
      count: () => Promise<number>;
      bulkCreate: (data: any[]) => Promise<unknown>;
    },
    data: any[],
  ): Promise<void> {
    if ((await model.count()) === 0) await model.bulkCreate(data);
  }

  private async ensureAdmin(): Promise<void> {
    const email = this.config.get<string>('SEED_ADMIN_EMAIL')?.trim();
    const password = this.config.get<string>('SEED_ADMIN_PASSWORD');
    if (!email || !password?.trim()) {
      throw new Error(
        'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required to run the seed command',
      );
    }
    const [admin, created] = await this.userModel.findOrCreate({
      where: { email },
      defaults: {
        email,
        password: await bcrypt.hash(password, 10),
        role: 'admin',
        isActivated: true,
        activationLink: null,
      },
    });
    if (!created && admin.role !== 'admin') {
      admin.role = 'admin';
      await admin.save();
    }
    await this.collectionModel.findOrCreate({
      where: { userId: admin.id },
      defaults: { userId: admin.id },
    });
  }

  async seed(): Promise<void> {
    await this.ensureAdmin();
    await this.insertWhenEmpty(this.authorModel, authors);
    await this.insertWhenEmpty(this.genreModel, genres);
    await this.insertWhenEmpty(this.trackModel, tracks);
    await this.insertWhenEmpty(this.trackGenreModel, trackGenres);
    await this.insertWhenEmpty(this.albumModel, albums);
    await this.insertWhenEmpty(this.albumTrackModel, albumTracks);
    await this.insertWhenEmpty(this.collectionModel, collections);
    await this.insertWhenEmpty(this.playlistModel, playlists);
    await this.insertWhenEmpty(this.playlistTrackModel, playlistTracks);
    await this.insertWhenEmpty(this.collectionAlbumModel, collectionAlbums);
    await this.insertWhenEmpty(this.collectionTrackModel, collectionTracks);
    await this.insertWhenEmpty(
      this.collectionPlaylistModel,
      collectionPlaylists,
    );
  }
}
