import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AccessTokenPayload } from 'src/auth/jwt.strategy';
import { AlbumModel } from 'src/album/model/album.model';
import { CollectionAlbumModel } from 'src/collection-album/model/collection-album.model';
import { CollectionPlaylistModel } from 'src/collection-playlist/model/collection-playlist.model';
import { CollectionTrackModel } from 'src/collection-track/model/collection-track.model';
import { PlaylistModel } from 'src/playlist/model/playlist.model';
import { TrackModel } from 'src/track/model/track.model';
import { CollectionModel } from './model/collection.model';

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
    if (requester.role !== 'admin' && requester.sub !== userId) {
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

  assertOwner(
    collection: CollectionModel,
    requester: AccessTokenPayload,
  ): void {
    if (requester.role !== 'admin' && collection.userId !== requester.sub) {
      throw new ForbiddenException('You can only access your own collection');
    }
  }
}
