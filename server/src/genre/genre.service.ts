import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GenreModel } from './model/genre.model';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class GenreService {
  constructor(
    @InjectModel(GenreModel) private GenreRepository: typeof GenreModel,
  ) {}

  async getOne(id: number) {
    try {
      if (!id) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      const author = await this.GenreRepository.findByPk(id);
      return author;
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
      const authors = await this.GenreRepository.findAll({
        limit: Number(count),
        offset: Number(offset),
      });
      return authors;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
