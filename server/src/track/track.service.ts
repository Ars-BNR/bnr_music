import { FileService, FileType } from './../file/file.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TrackModel } from './model/track.model';
import { CreateTrackDto } from './dto/create-track.dto';
import { Op, Sequelize } from 'sequelize';
import { UpdateTrackDto } from './dto/update-track.dto';
import { AuthorModel } from 'src/author/model/author.model';
import { AlbumModel } from 'src/album/model/album.model';

@Injectable()
export class TrackService {
  constructor(
    @InjectModel(TrackModel) private trackRepository: typeof TrackModel,
    private fileService: FileService,
  ) {}

  async create(
    dto: CreateTrackDto,
    picture: Express.Multer.File,
    audio: Express.Multer.File,
  ): Promise<TrackModel> {
    try {
      if (!dto || !picture || !audio) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      const audioPath = this.fileService.createFile(FileType.AUDIO, audio);
      const picturePath = this.fileService.createFile(FileType.IMAGE, picture);
      const track = await this.trackRepository.create({
        ...dto,
        listens: 0,
        audio: audioPath,
        picture: picturePath,
      });
      return track;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getTopTracks(count = 10, offset = 0) {
    try {
      if (!count || !offset) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }

      const tracks = await TrackModel.findAll({
        order: [['listens', 'DESC']],
        limit: Number(count),
        offset: Number(offset),
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

      return tracks;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAll(count = 10, offset = 0): Promise<TrackModel[]> {
    try {
      if (!count || !offset) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      const tracks = await TrackModel.findAll({
        limit: Number(count),
        offset: Number(offset),
      });
      return tracks;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getOne(id: number): Promise<TrackModel> {
    try {
      if (!id) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      const track = await this.trackRepository.findByPk(id, {
        subQuery: false,
        attributes: {
          include: [[Sequelize.literal('"albums"."id"'), 'albumId']],
        },
        include: [
          {
            model: AlbumModel,
            attributes: [],
            through: { attributes: [] },
          },
        ],
        raw: true,
        nest: true,
      });

      if (!track) {
        throw new HttpException('Трек не найден', HttpStatus.NOT_FOUND);
      }

      return track;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async listen(id: number) {
    try {
      if (!id) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      const track = await this.trackRepository.findByPk(id);
      track.listens += 1;
      track.save();
      return '+1 listen';
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async search(
    query: string,
    page: number = 1,
    limit: number = 5,
  ): Promise<TrackModel[]> {
    try {
      if (!query) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }

      const offset = (page - 1) * limit;

      const tracks = await this.trackRepository.findAll({
        subQuery: false,
        include: [
          {
            model: AuthorModel,
            required: true,
          },
          {
            model: AlbumModel,
            required: true,
          },
        ],
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: `%${query}%` } }, // Поиск по названию трека
            { '$author.name$': { [Op.iLike]: `%${query}%` } }, // Поиск по имени автора
            { '$albums.name$': { [Op.iLike]: `%${query}%` } }, // Поиск по названию альбома
          ],
        },
        limit: limit, // Ограничиваем количество результатов
        offset: offset, // Указываем смещение для пагинации
      });

      return tracks;
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
      const track = await this.trackRepository.destroy({ where: { id } });
      return track;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async change(id: number, updateData: UpdateTrackDto) {
    try {
      if (!id || !updateData) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      const track = await this.trackRepository.findByPk(id);

      Object.assign(track, updateData);

      await track.save();

      return track;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
