import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AlbumTrackModel } from './model/album-track.model';
import { CreateAlbumTrackDto } from './dto/create-albumTrack.dto';
import { UpdateAlbumTrackDto } from './dto/update-albumTrack.dto';
import { TrackModel } from 'src/track/model/track.model';
import { AlbumModel } from 'src/album/model/album.model';

@Injectable()
export class AlbumTrackService {
  constructor(
    @InjectModel(AlbumTrackModel)
    private albumTrackRepository: typeof AlbumTrackModel,
    @InjectModel(AlbumModel) private albumModel: typeof AlbumModel,
  ) {}

  async create(dto: CreateAlbumTrackDto) {
    try {
      if (!dto) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      const candidate = await this.albumTrackRepository.findOne({
        where: {
          trackId: dto.trackId,
          albumId: dto.albumId,
        },
      });
      if (candidate) {
        throw new HttpException(
          'Данный трек уже привязан к альбому',
          HttpStatus.BAD_REQUEST,
        );
      }
      const albumTrack = await this.albumTrackRepository.create({ ...dto });
      return albumTrack;
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
      const albumTrack = await this.albumModel.findByPk(id, {
        include: [
          {
            model: TrackModel,
            through: {
              attributes: [],
            },
          },
        ],
      });
      return albumTrack;
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
      const album = await this.albumTrackRepository.destroy({
        where: {
          id,
        },
      });

      if (album === 0) {
        throw new HttpException('Запись не найдена', HttpStatus.NOT_FOUND);
      }

      return album;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async change(id: number, updatedData: UpdateAlbumTrackDto) {
    try {
      if (!id) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      const idExists = await this.albumTrackRepository.findByPk(id);
      if (!idExists) {
        throw new HttpException(
          'Нет такого трека в плейлисте',
          HttpStatus.BAD_REQUEST,
        );
      }

      const newData = await this.albumTrackRepository.update(updatedData, {
        where: {
          id: id,
        },
      });
      return newData;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
