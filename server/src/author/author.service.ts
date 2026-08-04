import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuthorModel } from './model/author.model';

@Injectable()
export class AuthorService {
  constructor(
    @InjectModel(AuthorModel)
    private readonly authorRepository: typeof AuthorModel,
  ) {}
  async getOne(id: number): Promise<AuthorModel> {
    const author = await this.authorRepository.findByPk(id);
    if (!author) throw new NotFoundException('Author not found');
    return author;
  }
  getAll(count = 10, offset = 0): Promise<AuthorModel[]> {
    return this.authorRepository.findAll({ limit: count, offset });
  }
}
