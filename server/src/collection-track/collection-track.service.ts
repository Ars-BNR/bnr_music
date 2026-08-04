import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import { AccessTokenPayload } from 'src/auth/jwt.strategy';
import { AlbumModel } from 'src/album/model/album.model';
import { AuthorModel } from 'src/author/model/author.model';
import { CollectionModel } from 'src/collection/model/collection.model';
import { TrackModel } from 'src/track/model/track.model';
import { CreateCollectionTrackDto } from './dto/create-collectionTrack.dto';
import { CollectionTrackModel } from './model/collection-track.model';

@Injectable()
export class CollectionTrackService {
  constructor(
    @InjectModel(CollectionTrackModel)
    private readonly relationRepository: typeof CollectionTrackModel,
    @InjectModel(CollectionModel)
    private readonly collectionRepository: typeof CollectionModel,
  ) {}

  private async assertOwner(
    collectionId: number,
    requester: AccessTokenPayload,
  ): Promise<void> {
    const collection = await this.collectionRepository.findByPk(collectionId);
    if (!collection) throw new NotFoundException('Collection not found');
    if (requester.role !== 'admin' && collection.userId !== requester.sub) {
      throw new ForbiddenException('You can only change your own collection');
    }
  }

  async create(
    dto: CreateCollectionTrackDto,
    requester: AccessTokenPayload,
  ): Promise<CollectionTrackModel> {
    await this.assertOwner(dto.collectionId, requester);
    const relation = { collectionId: dto.collectionId, trackId: dto.trackId };
    const candidate = await this.relationRepository.findOne({
      where: relation,
    });
    if (candidate)
      throw new ConflictException('Track is already in this collection');
    return this.relationRepository.create(relation);
  }

  async delete(
    dto: CreateCollectionTrackDto,
    requester: AccessTokenPayload,
  ): Promise<void> {
    await this.assertOwner(dto.collectionId, requester);
    const affected = await this.relationRepository.destroy({
      where: { collectionId: dto.collectionId, trackId: dto.trackId },
    });
    if (!affected)
      throw new NotFoundException('Collection track relation not found');
  }

  async getTracksByCollectionId(
    collectionId: number,
    requester: AccessTokenPayload,
    limit = 10,
    offset = 0,
  ) {
    await this.assertOwner(collectionId, requester);
    const collectionTracks = await this.relationRepository.findAll({
      where: { collectionId },
      include: [
        {
          model: TrackModel,
          attributes: [
            'id',
            'name',
            'picture',
            'text',
            'listens',
            'audio',
            'authorId',
            [Sequelize.literal('"track->author"."name"'), 'authorName'],
            [Sequelize.literal('"track->albums"."id"'), 'albumId'],
          ],
          include: [
            { model: AuthorModel, attributes: [] },
            { model: AlbumModel, attributes: [], through: { attributes: [] } },
          ],
        },
      ],
      limit,
      offset,
      subQuery: false,
      raw: true,
      nest: true,
    });
    return collectionTracks.map((relation) => relation.track);
  }
}
