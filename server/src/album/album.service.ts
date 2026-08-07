import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { AuthorModel } from 'src/author/model/author.model';
import { TrackModel } from 'src/track/model/track.model';
import { CreateAlbumDto } from './dto/create-album.dto';
import { AlbumModel } from './model/album.model';
import { mapTrackModel } from 'src/track/track.mapper';
import { mapAlbumModel } from './album.mapper';

@Injectable()
export class AlbumService {
  constructor(
    @InjectModel(AlbumModel)
    private readonly albumRepository: typeof AlbumModel,
  ) {}

  private mapAlbum(model: AlbumModel) {
    return mapAlbumModel(model);
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

  async getCatalog(count = 20, offset = 0, query?: string) {
    const normalizedQuery = query?.trim();
    const where = normalizedQuery
      ? {
          [Op.or]: [
            { name: { [Op.iLike]: `%${normalizedQuery}%` } },
            { '$author.name$': { [Op.iLike]: `%${normalizedQuery}%` } },
          ],
        }
      : undefined;
    const authorSearchInclude = normalizedQuery
      ? [
          {
            model: AuthorModel,
            as: 'author',
            attributes: [],
            required: false,
          },
        ]
      : undefined;
    const [page, total] = await Promise.all([
      this.albumRepository.findAll({
        attributes: ['id'],
        where,
        include: authorSearchInclude,
        order: [
          ['listens', 'DESC'],
          ['id', 'ASC'],
        ],
        limit: count,
        offset,
      }),
      this.albumRepository.count({
        where,
        include: authorSearchInclude,
        distinct: true,
      }),
    ]);
    const ids = page.map((album) => album.id);
    if (!ids.length) return { items: [], total };
    const albums = await this.albumRepository.findAll({
      where: { id: { [Op.in]: ids } },
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
    const byId = new Map(
      albums.map((album) => [album.id, this.mapAlbum(album)]),
    );
    return {
      items: ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])),
      total,
    };
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
          through: { attributes: ['position'] },
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
              attributes: ['id', 'name'],
              through: { attributes: ['position'] },
              required: false,
            },
          ],
        },
      ],
    });
    if (!album) throw new NotFoundException('Album not found');
    const mapped = this.mapAlbum(album) as ReturnType<
      AlbumService['mapAlbum']
    > & {
      tracks?: TrackModel[];
    };
    return {
      ...mapped,
      tracks: (album.tracks ?? []).map(mapTrackModel),
    };
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
