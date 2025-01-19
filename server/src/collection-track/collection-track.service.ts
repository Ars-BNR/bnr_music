import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CollectionTrackModel } from './model/collection-track.model';
import { CreateCollectionTrackDto } from './dto/create-collectionTrack.dto';
import { TrackModel } from 'src/track/model/track.model';
import { Sequelize } from 'sequelize';
import { AuthorModel } from 'src/author/model/author.model';
import { AlbumModel } from 'src/album/model/album.model';

@Injectable()
export class CollectionTrackService {
  constructor(
    @InjectModel(CollectionTrackModel)
    private collectionTrackModelRepository: typeof CollectionTrackModel,
  ) {}

  async create(dto: CreateCollectionTrackDto) {
    try {
      if (!dto) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      console.log('dto', dto);
      console.log('typeof(dto.collectionId)', typeof dto.collectionId);
      const candidate = await this.collectionTrackModelRepository.findOne({
        where: {
          collectionId: dto.collectionId,
          trackId: dto.trackId,
        },
      });
      if (candidate) {
        throw new HttpException(
          'Данный трек  уже привязан к коллекции',
          HttpStatus.BAD_REQUEST,
        );
      }
      const collectionPlaylist =
        await this.collectionTrackModelRepository.create({
          ...dto,
        });
      return collectionPlaylist;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async delete(dto: CreateCollectionTrackDto) {
    try {
      if (!dto) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      const collectionPlaylist =
        await this.collectionTrackModelRepository.destroy({
          where: {
            collectionId: dto.collectionId,
            trackId: dto.trackId,
          },
        });

      if (collectionPlaylist === 0) {
        throw new HttpException('Запись не найдена', HttpStatus.NOT_FOUND);
      }

      return collectionPlaylist;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getTracksByCollectionId(
    collectionId: number,
    limit: number = 10,
    offset: number = 0,
  ) {
    try {
      if (!limit || !offset) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }

      const collectionTracks = await CollectionTrackModel.findAll({
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
              {
                model: AuthorModel,
                attributes: [],
              },
              {
                model: AlbumModel,
                attributes: [],
                through: { attributes: [] },
              },
            ],
          },
        ],
        limit: Number(limit),
        offset: Number(offset),
        subQuery: false,
        raw: true,
        nest: true,
      });

      return collectionTracks.map((ct) => ct.track);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
