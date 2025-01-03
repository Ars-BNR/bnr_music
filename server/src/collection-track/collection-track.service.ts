import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CollectionTrackModel } from './model/collection-track.model';
import { CreateCollectionTrackDto } from './dto/create-collectionTrack.dto';

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
          'Данный плейлист  уже привязан к коллекции',
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

  async delete(id: number) {
    try {
      if (!id) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      const collectionPlaylist =
        await this.collectionTrackModelRepository.destroy({
          where: {
            id,
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
}
