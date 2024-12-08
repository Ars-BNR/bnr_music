import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CollectionPlaylistModel } from './model/collection-playlist.model';
import { InjectModel } from '@nestjs/sequelize';
import { CreateCollectionPlaylistDto } from './dto/create-collectionPlaylist.dto';
import { UpdateCollectionPlaylistDto } from './dto/update-collectionPlaylist.dto';

@Injectable()
export class CollectionPlaylistService {
  constructor(
    @InjectModel(CollectionPlaylistModel)
    private collectionPlaylistModelRepository: typeof CollectionPlaylistModel,
  ) {}

  async create(dto: CreateCollectionPlaylistDto) {
    try {
      if (!dto) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      console.log('dto', dto);
      console.log('typeof(dto.collectionId)', typeof dto.collectionId);
      const candidate = await this.collectionPlaylistModelRepository.findOne({
        where: {
          collectionId: dto.collectionId,
          playlistId: dto.playlistId,
        },
      });
      if (candidate) {
        throw new HttpException(
          'Данный плейлист  уже привязан к коллекции',
          HttpStatus.BAD_REQUEST,
        );
      }
      const collectionPlaylist =
        await this.collectionPlaylistModelRepository.create({
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
        await this.collectionPlaylistModelRepository.destroy({
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

  async change(id: number, updatedData: UpdateCollectionPlaylistDto) {
    try {
      if (!id) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }

      const idExists =
        await this.collectionPlaylistModelRepository.findByPk(id);
      if (!idExists) {
        throw new HttpException(
          'Нет такого плейлиста в коллекции',
          HttpStatus.BAD_REQUEST,
        );
      }

      const newData = await this.collectionPlaylistModelRepository.update(
        updatedData,
        {
          where: {
            id: id,
          },
        },
      );
      return newData;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
