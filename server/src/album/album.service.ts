import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import { AuthorModel } from 'src/author/model/author.model';
import { TrackModel } from 'src/track/model/track.model';
import { CreateAlbumDto } from './dto/create-album.dto';
import { AlbumModel } from './model/album.model';

@Injectable()
export class AlbumService {
  constructor(
    @InjectModel(AlbumModel)
    private readonly albumRepository: typeof AlbumModel,
  ) {}

  private mapAlbum(model: AlbumModel) {
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
  }

  create(dto: CreateAlbumDto): Promise<AlbumModel> {
    return this.albumRepository.create({ ...dto, listens: 0 });
  }

  async getTopAlbum(count = 10, offset = 0) {
    const albums = await this.albumRepository.findAll({
      order: [['listens', 'DESC']],
      limit: count,
      offset,
      subQuery: false,
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
    });
    return albums.map((album) => this.mapAlbum(album));
  }

  async getAll(count = 10, offset = 0) {
    const albums = await this.albumRepository.findAll({
      limit: count,
      offset,
      subQuery: false,
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
    });
    return albums.map((album) => this.mapAlbum(album));
  }

  async getOne(id: number) {
    const album = await this.albumRepository.findByPk(id, {
      subQuery: false,
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
          model: TrackModel,
          as: 'tracks',
          through: { attributes: [] },
          include: [{ model: AuthorModel, as: 'author', attributes: [] }],
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
    });
    if (!album) throw new NotFoundException('Album not found');
    return this.mapAlbum(album);
  }

  async delete(id: number): Promise<void> {
    if (!(await this.albumRepository.destroy({ where: { id } }))) {
      throw new NotFoundException('Album not found');
    }
  }

  async change(id: number, updateData: CreateAlbumDto): Promise<AlbumModel> {
    const album = await this.albumRepository.findByPk(id);
    if (!album) throw new NotFoundException('Album not found');
    Object.assign(album, updateData);
    return album.save();
  }
}
