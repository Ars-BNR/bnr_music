import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PlaylistModel } from './model/playlist.model';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { TrackModel } from 'src/track/model/track.model';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { AuthorModel } from 'src/author/model/author.model';
import { AlbumModel } from 'src/album/model/album.model';
import { Sequelize } from 'sequelize';

@Injectable()
export class PlaylistService {
  constructor(
    @InjectModel(PlaylistModel)
    private playlistrepository: typeof PlaylistModel,
  ) {}

  async create(dto: CreatePlaylistDto) {
    try {
      if (!dto) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      const playlist = await this.playlistrepository.create({ ...dto });
      return playlist;
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
      const playlist = await this.playlistrepository.findAll({
        limit: Number(count),
        offset: Number(offset),
      });
      return playlist;
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
      const playlist = await this.playlistrepository.findByPk(id, {
        subQuery: false,

        include: [
          {
            model: TrackModel,
            through: { attributes: [] },
            attributes: {
              include: [
                [Sequelize.literal('"tracks->author"."name"'), 'authorName'],
                [Sequelize.literal('"tracks->albums"."id"'), 'albumId'],
              ],
            },
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
      });
      return playlist;
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
      const album = await this.playlistrepository.destroy({ where: { id } });
      return album;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async change(id: number, updateData: UpdatePlaylistDto) {
    try {
      if (!id || !updateData) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      const playlist = await this.playlistrepository.findByPk(id);

      Object.assign(playlist, updateData);

      await playlist.save();

      return playlist;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
