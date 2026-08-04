import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { AlbumModel } from 'src/album/model/album.model';
import { TrackModel } from 'src/track/model/track.model';
import { AuthorModel } from './model/author.model';

@Injectable()
export class AuthorService {
  constructor(
    @InjectModel(AuthorModel)
    private readonly authorRepository: typeof AuthorModel,
    @InjectModel(TrackModel)
    private readonly trackRepository: typeof TrackModel,
    @InjectModel(AlbumModel)
    private readonly albumRepository: typeof AlbumModel,
  ) {}
  async getOne(id: number): Promise<AuthorModel> {
    const author = await this.authorRepository.findByPk(id, {
      attributes: ['id', 'name', 'bio', 'avatar'],
    });
    if (!author) throw new NotFoundException('Author not found');
    return author;
  }
  getAll(count = 10, offset = 0, query?: string): Promise<AuthorModel[]> {
    const normalized = query?.trim();
    return this.authorRepository.findAll({
      where: normalized
        ? { name: { [Op.iLike]: `%${normalized}%` } }
        : undefined,
      attributes: ['id', 'name', 'bio', 'avatar'],
      order: [['name', 'ASC']],
      limit: count,
      offset,
    });
  }

  async getTracks(id: number, count = 20, offset = 0) {
    await this.getOne(id);
    const { rows, count: total } = await this.trackRepository.findAndCountAll({
      where: { [Op.or]: [{ authorId: id }, { '$featuredAuthors.id$': id }] },
      include: [
        {
          model: AuthorModel,
          as: 'author',
          attributes: ['id', 'name', 'avatar'],
        },
        {
          model: AuthorModel,
          as: 'featuredAuthors',
          attributes: ['id', 'name', 'avatar'],
          through: { attributes: ['position'] },
          required: false,
        },
        {
          model: AlbumModel,
          as: 'albums',
          attributes: ['id'],
          through: { attributes: [] },
          required: false,
        },
      ],
      order: [['id', 'ASC']],
      limit: count,
      offset,
      distinct: true,
      subQuery: false,
    });
    const tracks = rows.map((model) => {
      const track = model.get({ plain: true }) as TrackModel & {
        author?: AuthorModel;
        featuredAuthors?: AuthorModel[];
        albums?: AlbumModel[];
      };
      return {
        ...track,
        authorName: track.author?.name ?? '',
        albumId: track.albums?.[0]?.id,
        featuredAuthors:
          track.featuredAuthors?.map((author) => ({
            id: author.id,
            name: author.name,
            avatar: author.avatar ?? null,
          })) ?? [],
      };
    });
    return { tracks, total };
  }

  async getAlbums(id: number, count = 12, offset = 0) {
    await this.getOne(id);
    const { rows, count: total } = await this.albumRepository.findAndCountAll({
      where: { [Op.or]: [{ authorId: id }, { '$featuredAuthors.id$': id }] },
      include: [
        {
          model: AuthorModel,
          as: 'author',
          attributes: ['id', 'name', 'avatar'],
        },
        {
          model: AuthorModel,
          as: 'featuredAuthors',
          attributes: ['id', 'name', 'avatar'],
          through: { attributes: ['position'] },
          required: false,
        },
      ],
      order: [['id', 'ASC']],
      limit: count,
      offset,
      distinct: true,
      subQuery: false,
    });
    const albums = rows.map((model) => {
      const album = model.get({ plain: true }) as AlbumModel & {
        author?: AuthorModel;
        featuredAuthors?: AuthorModel[];
      };
      return {
        ...album,
        authorName: album.author?.name ?? '',
        featuredAuthors:
          album.featuredAuthors?.map((author) => ({
            id: author.id,
            name: author.name,
            avatar: author.avatar ?? null,
          })) ?? [],
      };
    });
    return { albums, total };
  }
}
