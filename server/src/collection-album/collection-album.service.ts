import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import { AccessTokenPayload } from 'src/auth/jwt.strategy';
import { OwnershipService } from 'src/auth/ownership.service';
import { AlbumModel } from 'src/album/model/album.model';
import { AuthorModel } from 'src/author/model/author.model';
import { CreateCollectionAlbumDto } from './dto/create-collectionAlbum.dto';
import { UpdateCollectionAlbumDto } from './dto/update-collectionAlbum.dto';
import { CollectionAlbumModel } from './model/collection-album.model';

@Injectable()
export class CollectionAlbumService {
  constructor(
    @InjectModel(CollectionAlbumModel)
    private readonly relationRepository: typeof CollectionAlbumModel,
    private readonly ownership: OwnershipService,
  ) {}

  async create(
    dto: CreateCollectionAlbumDto,
    user: AccessTokenPayload,
  ): Promise<CollectionAlbumModel> {
    await this.ownership.ensureCollectionOwner(dto.collectionId, user);
    const relation = { collectionId: dto.collectionId, albumId: dto.albumId };
    if (await this.relationRepository.findOne({ where: relation })) {
      throw new ConflictException('Album is already in this collection');
    }
    return this.relationRepository.create(relation);
  }

  async delete(id: number, user: AccessTokenPayload): Promise<void> {
    const relation = await this.relationRepository.findByPk(id);
    if (!relation)
      throw new NotFoundException('Collection album relation not found');
    await this.ownership.ensureCollectionOwner(relation.collectionId, user);
    await relation.destroy();
  }

  async change(
    id: number,
    dto: UpdateCollectionAlbumDto,
    user: AccessTokenPayload,
  ): Promise<CollectionAlbumModel> {
    const relation = await this.relationRepository.findByPk(id);
    if (!relation)
      throw new NotFoundException('Collection album relation not found');
    await this.ownership.ensureCollectionOwner(relation.collectionId, user);
    const nextCollectionId = dto.collectionId ?? relation.collectionId;
    const nextAlbumId = dto.albumId ?? relation.albumId;
    await this.ownership.ensureCollectionOwner(nextCollectionId, user);
    const duplicate = await this.relationRepository.findOne({
      where: { collectionId: nextCollectionId, albumId: nextAlbumId },
    });
    if (duplicate && duplicate.id !== relation.id)
      throw new ConflictException('Album is already in this collection');
    relation.collectionId = nextCollectionId;
    relation.albumId = nextAlbumId;
    return relation.save();
  }

  async getAlbumsByCollectionId(
    collectionId: number,
    user: AccessTokenPayload,
    limit = 10,
    offset = 0,
  ) {
    await this.ownership.ensureCollectionOwner(collectionId, user);
    return this.relationRepository.findAll({
      where: { collectionId },
      include: [
        {
          model: AlbumModel,
          attributes: [],
          include: [{ model: AuthorModel, attributes: [] }],
        },
      ],
      attributes: [
        'id',
        'albumId',
        [Sequelize.literal('album.name'), 'Albumname'],
        [Sequelize.literal('album.picture'), 'Albumpicture'],
        [Sequelize.literal('album.listens'), 'Albumlistens'],
        [Sequelize.literal('"album->author"."name"'), 'authorName'],
      ],
      limit,
      offset,
      subQuery: false,
      raw: true,
      nest: true,
    });
  }
}
