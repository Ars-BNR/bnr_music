import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PlaylistTrackModel } from './model/playlist-track.model';
import { CreatePlaylistTrackDto } from './dto/create-playlistTrack.dto';
import { UpdatePlaylistTrackDto } from './dto/update-playlistTrack.dto';
import { Sequelize } from 'sequelize';
import { TrackModel } from 'src/track/model/track.model';
import { PlaylistModel } from 'src/playlist/model/playlist.model';
import { AuthorModel } from 'src/author/model/author.model';

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

  async getTracksByPlaylistId(
    playlistId: number,
    limit: number = 10,
    offset: number = 0,
  ) {
    try {
      if (!playlistId) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }

      const playlistTracks = await this.playlistTrackRepository.findAll({
        where: { playlistId },
        attributes: [
          'id',
          'playlistId',
          'trackId',
          [Sequelize.literal('"track"."name"'), 'name'],
          [Sequelize.literal('"track"."picture"'), 'picture'],
          [Sequelize.literal('"track"."text"'), 'text'],
          [Sequelize.literal('"track"."listens"'), 'listens'],
          [Sequelize.literal('"track"."audio"'), 'audio'],
          [Sequelize.literal('"track"."authorId"'), 'authorId'],
          [Sequelize.literal('"track->author"."name"'), 'authorName'], // Имя автора
          [Sequelize.literal('"playlist"."name"'), 'playlistname'], // Имя плейлиста
        ],
        include: [
          {
            model: TrackModel,
            attributes: [], // Не включаем поля трека, так как они уже выбраны через literal
            include: [
              {
                model: AuthorModel,
                attributes: [], // Не включаем поля автора, так как они уже выбраны через literal
              },
            ],
          },
          {
            model: PlaylistModel,
            attributes: [], // Не включаем поля плейлиста, так как они уже выбраны через literal
          },
        ],
        limit: Number(limit),
        offset: Number(offset),
        subQuery: false,
        raw: true, // Возвращаем сырые данные (плоский формат)
        nest: true, // Вложенные объекты для связанных моделей
      });

      if (!playlistTracks || playlistTracks.length === 0) {
        throw new HttpException(
          'Треки в плейлисте не найдены',
          HttpStatus.NOT_FOUND,
        );
      }

      return playlistTracks;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
