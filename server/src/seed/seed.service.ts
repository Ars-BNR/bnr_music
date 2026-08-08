import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
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
import { RbacService } from 'src/rbac/rbac.service';
import { Sequelize } from 'sequelize';
import { TokenService } from 'src/token/token.service';
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
import seedAuthorCredentials from './data/user-seed';

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
    private readonly rbacService: RbacService,
    private readonly tokenService: TokenService,
    @InjectConnection() private readonly sequelize: Sequelize,
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
    await this.rbacService.ensureSystemDefinitions();
    await this.sequelize.transaction(async (transaction) => {
      const [admin] = await this.userModel.findOrCreate({
        where: { email },
        defaults: {
          email,
          password: await bcrypt.hash(password, 10),
          isActivated: true,
          activationLink: null,
        },
        transaction,
      });
      await this.rbacService.assignSystemRole(admin.id, 'user', transaction);
      await this.rbacService.assignSystemRole(admin.id, 'admin', transaction);
      await this.collectionModel.findOrCreate({
        where: { userId: admin.id },
        defaults: { userId: admin.id },
        transaction,
      });
    });
  }

  private async ensureSeedAuthorAccounts(): Promise<void> {
    await this.sequelize.transaction(async (transaction) => {
      for (const credential of seedAuthorCredentials) {
        const [authorByName, userByEmail] = await Promise.all([
          this.authorModel.findOne({
            where: { name: credential.authorName },
            transaction,
            lock: transaction.LOCK.UPDATE,
          }),
          this.userModel.findOne({
            where: { email: credential.email },
            transaction,
            lock: transaction.LOCK.UPDATE,
          }),
        ]);

        const authorByEmailOwner = userByEmail
          ? await this.authorModel.findOne({
              where: { userId: userByEmail.id },
              transaction,
              lock: transaction.LOCK.UPDATE,
            })
          : null;

        if (
          userByEmail &&
          (!authorByEmailOwner ||
            (authorByName && authorByEmailOwner.id !== authorByName.id))
        ) {
          throw new Error(
            `Cannot seed author ${credential.authorName}: email ${credential.email} belongs to an unrelated user`,
          );
        }

        const author = authorByEmailOwner ?? authorByName;
        if (!author) {
          throw new Error(
            `Cannot seed author account: author ${credential.authorName} was not found`,
          );
        }

        const linkedUser = author.userId
          ? await this.userModel.findByPk(author.userId, {
              transaction,
              lock: transaction.LOCK.UPDATE,
            })
          : null;

        if (linkedUser && userByEmail && linkedUser.id !== userByEmail.id) {
          throw new Error(
            `Cannot seed author ${credential.authorName}: email ${credential.email} belongs to another account`,
          );
        }

        let user = linkedUser ?? userByEmail;
        if (!user) {
          user = await this.userModel.create(
            {
              email: credential.email,
              password: await bcrypt.hash(credential.password, 10),
              displayName: author.name,
              isActivated: true,
              activationLink: null,
              accountStatus: 'active',
              blockedAt: null,
              deletedAt: null,
              mustChangePassword: false,
            },
            { transaction },
          );
        } else {
          const passwordMatches = await bcrypt
            .compare(credential.password, user.password)
            .catch(() => false);
          const updates: Partial<UserModel> = {
            email: credential.email,
            isActivated: true,
            activationLink: null,
            accountStatus: 'active',
            blockedAt: null,
            deletedAt: null,
            mustChangePassword: false,
          };
          if (!passwordMatches) {
            updates.password = await bcrypt.hash(credential.password, 10);
            updates.sessionVersion = (user.sessionVersion ?? 0) + 1;
          }
          await user.update(updates, { transaction });
          if (!passwordMatches) {
            await this.tokenService.removeAllForUser(user.id, transaction);
          }
        }

        if (author.userId !== user.id) {
          await author.update({ userId: user.id }, { transaction });
        }
        await this.collectionModel.findOrCreate({
          where: { userId: user.id },
          defaults: { userId: user.id },
          transaction,
        });
        await this.rbacService.assignSystemRole(user.id, 'user', transaction);
        await this.rbacService.assignSystemRole(user.id, 'author', transaction);
      }
    });

    console.table(
      seedAuthorCredentials.map(({ authorName, email, password }) => ({
        author: authorName,
        email,
        password,
      })),
    );
  }

  async seed(): Promise<void> {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new Error(
        'Catalog seed is disabled in production because it contains mock credentials',
      );
    }
    await this.ensureAdmin();
    await this.insertWhenEmpty(this.authorModel, authors);
    await this.ensureSeedAuthorAccounts();
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
