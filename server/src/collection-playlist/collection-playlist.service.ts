import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import { AccessTokenPayload } from 'src/auth/jwt.strategy';
import { OwnershipService } from 'src/auth/ownership.service';
import { PlaylistModel } from 'src/playlist/model/playlist.model';
import { CreateCollectionPlaylistDto } from './dto/create-collectionPlaylist.dto';
import { UpdateCollectionPlaylistDto } from './dto/update-collectionPlaylist.dto';
import { CollectionPlaylistModel } from './model/collection-playlist.model';

@Injectable()
export class CollectionPlaylistService {
  constructor(
    @InjectModel(CollectionPlaylistModel)
    private readonly relationRepository: typeof CollectionPlaylistModel,
    private readonly ownership: OwnershipService,
  ) {}

  async create(
    dto: CreateCollectionPlaylistDto,
    user: AccessTokenPayload,
  ): Promise<CollectionPlaylistModel> {
    await this.ownership.ensureCollectionOwner(dto.collectionId, user);
    await this.ownership.ensurePlaylistOwner(dto.playlistId, user);
    const relation = {
      collectionId: dto.collectionId,
      playlistId: dto.playlistId,
    };
    if (await this.relationRepository.findOne({ where: relation }))
      throw new ConflictException('Playlist is already in this collection');
    return this.relationRepository.create(relation);
  }

  async delete(id: number, user: AccessTokenPayload): Promise<void> {
    const relation = await this.relationRepository.findByPk(id);
    if (!relation)
      throw new NotFoundException('Collection playlist relation not found');
    await this.ownership.ensureCollectionOwner(relation.collectionId, user);
    await relation.destroy();
  }

  async change(
    id: number,
    dto: UpdateCollectionPlaylistDto,
    user: AccessTokenPayload,
  ): Promise<CollectionPlaylistModel> {
    const relation = await this.relationRepository.findByPk(id);
    if (!relation)
      throw new NotFoundException('Collection playlist relation not found');
    await this.ownership.ensureCollectionOwner(relation.collectionId, user);
    const collectionId = dto.collectionId ?? relation.collectionId;
    const playlistId = dto.playlistId ?? relation.playlistId;
    await this.ownership.ensureCollectionOwner(collectionId, user);
    await this.ownership.ensurePlaylistOwner(playlistId, user);
    const duplicate = await this.relationRepository.findOne({
      where: { collectionId, playlistId },
    });
    if (duplicate && duplicate.id !== relation.id)
      throw new ConflictException('Playlist is already in this collection');
    relation.collectionId = collectionId;
    relation.playlistId = playlistId;
    return relation.save();
  }

  async getPlaylistsByCollectionId(
    collectionId: number,
    user: AccessTokenPayload,
    limit = 10,
    offset = 0,
  ) {
    await this.ownership.ensureCollectionOwner(collectionId, user);
    return this.relationRepository.findAll({
      where: { collectionId },
      include: [{ model: PlaylistModel, attributes: [] }],
      attributes: ['id', [Sequelize.literal('playlist.name'), 'name']],
      limit,
      offset,
      subQuery: false,
      raw: true,
      nest: true,
    });
  }
}
