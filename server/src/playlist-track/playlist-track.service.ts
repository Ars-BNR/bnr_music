import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PlaylistTrackModel } from './model/playlist-track.model';
import { CreatePlaylistTrackDto } from './dto/create-playlistTrack.dto';
import { UpdatePlaylistTrackDto } from './dto/update-playlistTrack.dto';

@Injectable()
export class PlaylistTrackService {
  constructor(
    @InjectModel(PlaylistTrackModel)
    private playlistTrackRepository: typeof PlaylistTrackModel,
  ) {}

  async create(dto: CreatePlaylistTrackDto) {
    try {
      if (!dto) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      const candidate = await this.playlistTrackRepository.findOne({
        where: {
          playlistId: dto.playlistId,
          trackId: dto.trackId,
        },
      });
      if (candidate) {
        throw new HttpException(
          'Данный трек уже привязан к альбому',
          HttpStatus.BAD_REQUEST,
        );
      }
      const playlistTrack = await this.playlistTrackRepository.create({
        ...dto,
      });
      return playlistTrack;
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

      const playlistTrack = await this.playlistTrackRepository.destroy({
        where: {
          id,
        },
      });
      if (playlistTrack === 0) {
        throw new HttpException('Запись не найдена', HttpStatus.NOT_FOUND);
      }

      return playlistTrack;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async change(id: number, updatedData: UpdatePlaylistTrackDto) {
    try {
      if (!id) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      const idExists = await this.playlistTrackRepository.findByPk(id);
      if (!idExists) {
        throw new HttpException(
          'Нет такого трека в плейлисте',
          HttpStatus.BAD_REQUEST,
        );
      }

      const newData = await this.playlistTrackRepository.update(updatedData, {
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
