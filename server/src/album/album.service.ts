import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AlbumModel } from './model/album.model';
import { CreateAlbumDto } from './dto/create-album.dto';
import { TrackModel } from 'src/track/model/track.model';
import { AuthorModel } from 'src/author/model/author.model';
import { Sequelize } from 'sequelize';

@Injectable()
export class AlbumService {
  constructor(
    @InjectModel(AlbumModel) private albumRepository: typeof AlbumModel,
  ) {}

  async create(dto: CreateAlbumDto) {
    try {
      if (!dto) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      const album = await this.albumRepository.create({
        ...dto,
      });
      return album;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getTopAlbum(count = 10, offset = 0): Promise<AlbumModel[]> {
    try {
      if (!count || !offset) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }

      const albums = await this.albumRepository.findAll({
        order: [['listens', 'DESC']],
        limit: Number(count),
        offset: Number(offset),
        subQuery: false,
        attributes: {
          include: [[Sequelize.literal('"author"."name"'), 'authorName']],
        },
        include: [
          {
            model: AuthorModel,
            attributes: [],
          },
        ],
        raw: true,
        nest: true,
      });

      return albums;
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
      const album = await this.albumRepository.findAll({
        limit: Number(count),
        offset: Number(offset),
        subQuery: false,
        attributes: {
          include: [[Sequelize.literal('"author"."name"'), 'authorName']],
        },
        include: [
          {
            model: AuthorModel,
            attributes: [],
          },
        ],
      });
      return album;
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
      const album = await this.albumRepository.findByPk(id, {
        subQuery: false,
        attributes: {
          include: [[Sequelize.literal('"author"."name"'), 'authorName']],
        },
        include: [
          {
            model: AuthorModel,
            attributes: [],
          },
          {
            model: TrackModel,
            through: { attributes: [] },
            include: [
              {
                model: AuthorModel,
                attributes: [],
              },
            ],
            attributes: {
              include: [
                [
                  Sequelize.literal('"tracks->AlbumTrackModel"."albumId"'),
                  'albumId',
                ],
                [Sequelize.literal('"tracks->author"."name"'), 'authorName'],
              ],
            },
          },
        ],
        logging: console.log,
      });
      if (!album) {
        throw new HttpException('Альбом не найден', HttpStatus.NOT_FOUND);
      }
      return album;
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
      const album = await this.albumRepository.destroy({ where: { id } });
      return album;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async change(id: number, updateData: CreateAlbumDto) {
    try {
      if (!id || !updateData) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      const album = await this.albumRepository.findByPk(id);

      Object.assign(album, updateData);

      await album.save();

      return album;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
