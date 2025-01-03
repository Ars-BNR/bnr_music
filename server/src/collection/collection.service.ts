import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CollectionModel } from './model/collection.model';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { PlaylistModel } from 'src/playlist/model/playlist.model';
import { AlbumModel } from 'src/album/model/album.model';
import { TrackModel } from 'src/track/model/track.model';

@Injectable()
export class CollectionService {
  constructor(
    @InjectModel(CollectionModel)
    private collectionRepository: typeof CollectionModel,
  ) {}

  async create(dto: CreateCollectionDto) {
    try {
      if (!dto) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      const collection = await this.collectionRepository.create({ ...dto });
      return collection;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAll(count = 10, offset = 0) {
    try {
      if (!count || !offset) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      const collection = await this.collectionRepository.findAll({
        limit: Number(count),
        offset: Number(offset),
      });
      return collection;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getOne(id: number) {
    try {
      if (!id) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      const collection = await this.collectionRepository.findByPk(id, {
        include: [
          {
            model: PlaylistModel,
          },
          {
            model: AlbumModel,
          },
          {
            model: TrackModel,
            through: { attributes: [] },
          },
        ],
      });
      return collection;
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
      const collection = await this.collectionRepository.destroy({
        where: { id },
      });
      return collection;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async change(id: number, updateData: CreateCollectionDto) {
    try {
      if (!id || !updateData) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      const collection = await this.collectionRepository.findByPk(id);

      Object.assign(collection, updateData);

      await collection.save();

      return collection;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getByUserId(userId: number) {
    try {
      if (!userId) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }

      const collection = await this.collectionRepository.findOne({
        where: { userId },
        include: [
          {
            model: PlaylistModel,
          },
          {
            model: AlbumModel,
          },
          {
            model: TrackModel,
            through: { attributes: [] },
          },
        ],
      });

      if (!collection) {
        throw new HttpException('Коллекция не найдена', HttpStatus.NOT_FOUND);
      }

      return collection;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
