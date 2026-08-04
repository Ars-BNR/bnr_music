import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CollectionModel } from 'src/collection/model/collection.model';
import { PlaylistModel } from 'src/playlist/model/playlist.model';
import { AccessTokenPayload } from './jwt.strategy';

@Injectable()
export class OwnershipService {
  constructor(
    @InjectModel(CollectionModel)
    private readonly collectionRepository: typeof CollectionModel,
    @InjectModel(PlaylistModel)
    private readonly playlistRepository: typeof PlaylistModel,
  ) {}

  async ensureCollectionOwner(
    collectionId: number,
    user: AccessTokenPayload,
  ): Promise<CollectionModel> {
    const collection = await this.collectionRepository.findByPk(collectionId);
    if (!collection) throw new NotFoundException('Collection not found');
    if (user.role !== 'admin' && collection.userId !== user.sub) {
      throw new ForbiddenException('You can only access your own collection');
    }
    return collection;
  }

  async ensurePlaylistOwner(
    playlistId: number,
    user: AccessTokenPayload,
  ): Promise<PlaylistModel> {
    const playlist = await this.playlistRepository.findByPk(playlistId);
    if (!playlist) throw new NotFoundException('Playlist not found');
    if (user.role !== 'admin' && playlist.userId !== user.sub) {
      throw new ForbiddenException('You can only access your own playlist');
    }
    return playlist;
  }
}
