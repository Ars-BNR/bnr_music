import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GenreModel } from './model/genre.model';

@Injectable()
export class GenreService {
  constructor(
    @InjectModel(GenreModel)
    private readonly genreRepository: typeof GenreModel,
  ) {}
  async getOne(id: number): Promise<GenreModel> {
    const genre = await this.genreRepository.findByPk(id);
    if (!genre) throw new NotFoundException('Genre not found');
    return genre;
  }
  getAll(count = 10, offset = 0): Promise<GenreModel[]> {
    return this.genreRepository.findAll({ limit: count, offset });
  }
}
