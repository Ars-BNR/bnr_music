import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuthorModel } from './model/author.model';

@Injectable()
export class AuthorService {
  constructor(
    @InjectModel(AuthorModel) private AuthorRepository: typeof AuthorModel,
  ) {}

  async getOne(id: number) {
    try {
      if (!id) {
        throw new HttpException(
          'Не указаны все данные',
          HttpStatus.BAD_REQUEST,
        );
      }
      const author = await this.AuthorRepository.findByPk(id);
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
      const authors = await this.AuthorRepository.findAll({
        limit: Number(count),
        offset: Number(offset),
      });
      return authors;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
