import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AccessTokenPayload } from 'src/auth/jwt.strategy';
import { AlbumModel } from 'src/album/model/album.model';
import { AuthorModel } from 'src/author/model/author.model';
import { CollectionAlbumModel } from 'src/collection-album/model/collection-album.model';
import { CollectionPlaylistModel } from 'src/collection-playlist/model/collection-playlist.model';
import { CollectionTrackModel } from 'src/collection-track/model/collection-track.model';
import { PlaylistModel } from 'src/playlist/model/playlist.model';
import { TrackModel } from 'src/track/model/track.model';
import { CollectionModel } from './model/collection.model';
import { Op } from 'sequelize';

@Injectable()
export class CollectionService {
  constructor(
    @InjectModel(CollectionModel)
    private readonly collectionRepository: typeof CollectionModel,
    @InjectModel(CollectionTrackModel)
    private readonly collectionTrackRepository: typeof CollectionTrackModel,
    @InjectModel(CollectionAlbumModel)
    private readonly collectionAlbumRepository: typeof CollectionAlbumModel,
    @InjectModel(CollectionPlaylistModel)
    private readonly collectionPlaylistRepository: typeof CollectionPlaylistModel,
    @InjectModel(AlbumModel)
    private readonly albumRepository: typeof AlbumModel,
    @InjectModel(TrackModel)
    private readonly trackRepository: typeof TrackModel,
  ) {}

  async createForUser(userId: number): Promise<CollectionModel> {
    const [collection] = await this.collectionRepository.findOrCreate({
      where: { userId },
      defaults: { userId },
    });
    return collection;
  }

  async getAll(count = 10, offset = 0): Promise<CollectionModel[]> {
    return this.collectionRepository.findAll({ limit: count, offset });
  }

  async getOne(
    id: number,
    requester: AccessTokenPayload,
  ): Promise<CollectionModel> {
    const collection = await this.collectionRepository.findByPk(id, {
      include: [
        { model: PlaylistModel },
        { model: AlbumModel },
        { model: TrackModel, through: { attributes: [] } },
      ],
    });
    if (!collection) throw new NotFoundException('Collection not found');
    this.assertOwner(collection, requester);
    return collection;
  }

  async delete(id: number, requester: AccessTokenPayload): Promise<void> {
    const collection = await this.collectionRepository.findByPk(id);
    if (!collection) throw new NotFoundException('Collection not found');
    this.assertOwner(collection, requester);
    await collection.destroy();
  }

  async getByUserId(
    userId: number,
    requester: AccessTokenPayload,
  ): Promise<CollectionModel> {
    if (requester.sub !== userId) {
      throw new ForbiddenException('You can only access your own collection');
    }
    const collection = await this.collectionRepository.findOne({
      where: { userId },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    return collection;
  }

  async getCollectionSummary(userId: number, requester: AccessTokenPayload) {
    const collection = await this.getByUserId(userId, requester);
    const [totalPlaylists, totalAlbums, totalTracks] = await Promise.all([
      this.collectionPlaylistRepository.count({
        where: { collectionId: collection.id },
      }),
      this.collectionAlbumRepository.count({
        where: { collectionId: collection.id },
      }),
      this.collectionTrackRepository.count({
        where: { collectionId: collection.id },
      }),
    ]);
    return {
      collectionId: collection.id,
      totalPlaylists,
      totalAlbums,
      totalTracks,
    };
  }

  async getCurrentCollection(userId: number): Promise<CollectionModel> {
    const collection = await this.collectionRepository.findOne({
      where: { userId },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    return collection;
  }

  async getCurrentCollectionSummary(userId: number) {
    const collection = await this.getCurrentCollection(userId);
    const [totalPlaylists, totalAlbums, totalTracks] = await Promise.all([
      this.collectionPlaylistRepository.count({
        where: { collectionId: collection.id },
      }),
      this.collectionAlbumRepository.count({
        where: { collectionId: collection.id },
      }),
      this.collectionTrackRepository.count({
        where: { collectionId: collection.id },
      }),
    ]);
    return {
      collectionId: collection.id,
      totalPlaylists,
      totalAlbums,
      totalTracks,
    };
  }

  async getCurrentUserAlbums(userId: number, count = 20, offset = 0) {
    const collection = await this.getCurrentCollection(userId);
    const [relations, total] = await Promise.all([
      this.collectionAlbumRepository.findAll({
        where: { collectionId: collection.id },
        attributes: ['id', 'albumId'],
        order: [['id', 'ASC']],
        limit: count,
        offset,
      }),
      this.collectionAlbumRepository.count({
        where: { collectionId: collection.id },
      }),
    ]);
    const albumIds = [
      ...new Set(relations.map((relation) => relation.albumId)),
    ];
    if (albumIds.length === 0) return { items: [], total };

    const albums = await this.albumRepository.findAll({
      where: { id: { [Op.in]: albumIds } },
      attributes: ['id', 'name', 'picture', 'listens', 'authorId'],
      include: [
        {
          model: AuthorModel,
          as: 'author',
          attributes: ['id', 'name', 'avatar'],
          required: true,
        },
        {
          model: AuthorModel,
          as: 'featuredAuthors',
          attributes: ['id', 'name', 'avatar'],
          through: { attributes: ['position'] },
          required: false,
        },
      ],
    });
    const albumsById = new Map(albums.map((album) => [album.id, album]));
    return {
      items: relations.flatMap((relation) => {
        const album = albumsById.get(relation.albumId);
        if (!album) return [];
        const value = album.get({ plain: true }) as AlbumModel & {
          featuredAuthors?: AuthorModel[];
        };
        return [
          {
            favoriteRelationId: relation.id,
            id: value.id,
            name: value.name,
            picture: value.picture,
            listens: value.listens,
            authorId: value.authorId,
            authorName: value.author?.name ?? '',
            featuredAuthors:
              value.featuredAuthors?.map((author) => ({
                id: author.id,
                name: author.name,
                avatar: author.avatar ?? null,
              })) ?? [],
          },
        ];
      }),
      total,
    };
  }

  async getCurrentUserAlbumStatus(userId: number, albumId: number) {
    const collection = await this.getCurrentCollection(userId);
    const relation = await this.collectionAlbumRepository.findOne({
      where: { collectionId: collection.id, albumId },
    });
    return { isFavorite: Boolean(relation) };
  }

  async getCurrentUserTracks(userId: number, count = 20, offset = 0) {
    const collection = await this.getCurrentCollection(userId);
    const [relations, total] = await Promise.all([
      this.collectionTrackRepository.findAll({
        where: { collectionId: collection.id },
        attributes: ['id', 'trackId'],
        order: [['id', 'ASC']],
        limit: count,
        offset,
      }),
      this.collectionTrackRepository.count({
        where: { collectionId: collection.id },
      }),
    ]);
    const trackIds = [
      ...new Set(relations.map((relation) => relation.trackId)),
    ];
    if (trackIds.length === 0) return { items: [], total };

    const tracks = await this.trackRepository.findAll({
      where: { id: { [Op.in]: trackIds } },
      attributes: [
        'id',
        'name',
        'picture',
        'text',
        'listens',
        'audio',
        'authorId',
      ],
      include: [
        {
          model: AuthorModel,
          as: 'author',
          attributes: ['id', 'name', 'avatar'],
          required: true,
        },
        {
          model: AuthorModel,
          as: 'featuredAuthors',
          attributes: ['id', 'name', 'avatar'],
          through: { attributes: ['position'] },
          required: false,
        },
        {
          model: AlbumModel,
          as: 'albums',
          attributes: ['id'],
          through: { attributes: [] },
          required: false,
        },
      ],
    });
    const tracksById = new Map(tracks.map((track) => [track.id, track]));

    return {
      items: relations.flatMap((relation) => {
        const model = tracksById.get(relation.trackId);
        if (!model) return [];
        const track = model.get({ plain: true }) as TrackModel & {
          author?: AuthorModel;
          albums?: AlbumModel[];
          featuredAuthors?: AuthorModel[];
        };
        return [
          {
            id: track.id,
            name: track.name,
            picture: track.picture,
            text: track.text,
            listens: track.listens,
            audio: track.audio,
            authorId: track.authorId,
            authorName: track.author?.name ?? '',
            albumId: track.albums?.[0]?.id,
            featuredAuthors:
              track.featuredAuthors?.map((author) => ({
                id: author.id,
                name: author.name,
                avatar: author.avatar ?? null,
              })) ?? [],
          },
        ];
      }),
      total,
    };
  }

  async getCurrentUserTrackStatus(userId: number, trackId: number) {
    const collection = await this.getCurrentCollection(userId);
    const relation = await this.collectionTrackRepository.findOne({
      where: { collectionId: collection.id, trackId },
    });
    return { isFavorite: Boolean(relation) };
  }

  async setCurrentUserTrack(userId: number, trackId: number) {
    const [collection, track] = await Promise.all([
      this.getCurrentCollection(userId),
      this.trackRepository.findByPk(trackId, { attributes: ['id'] }),
    ]);
    if (!track) throw new NotFoundException('Track not found');
    await this.collectionTrackRepository.findOrCreate({
      where: { collectionId: collection.id, trackId },
      defaults: { collectionId: collection.id, trackId },
    });
    return { isFavorite: true };
  }

  async removeCurrentUserTrack(userId: number, trackId: number) {
    const collection = await this.getCurrentCollection(userId);
    await this.collectionTrackRepository.destroy({
      where: { collectionId: collection.id, trackId },
    });
    return { isFavorite: false };
  }

  async setCurrentUserAlbum(userId: number, albumId: number) {
    const [collection, album] = await Promise.all([
      this.getCurrentCollection(userId),
      this.albumRepository.findByPk(albumId),
    ]);
    if (!album) throw new NotFoundException('Album not found');
    const [relation] = await this.collectionAlbumRepository.findOrCreate({
      where: { collectionId: collection.id, albumId },
      defaults: { collectionId: collection.id, albumId },
    });
    return { isFavorite: true, favoriteRelationId: relation.id };
  }

  async removeCurrentUserAlbum(userId: number, albumId: number) {
    const collection = await this.getCurrentCollection(userId);
    await this.collectionAlbumRepository.destroy({
      where: { collectionId: collection.id, albumId },
    });
    return { isFavorite: false };
  }

  assertOwner(
    collection: CollectionModel,
    requester: AccessTokenPayload,
  ): void {
    if (collection.userId !== requester.sub) {
      throw new ForbiddenException('You can only access your own collection');
    }
  }
}
