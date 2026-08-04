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

  create(dto: CreateAlbumDto): Promise<AlbumModel> {
    return this.albumRepository.create({ ...dto, listens: 0 });
  }

  getTopAlbum(count = 10, offset = 0): Promise<AlbumModel[]> {
    return this.albumRepository.findAll({
      order: [['listens', 'DESC']],
      limit: count,
      offset,
      subQuery: false,
      attributes: {
        include: [[Sequelize.literal('"author"."name"'), 'authorName']],
      },
      include: [{ model: AuthorModel, attributes: [] }],
      raw: true,
      nest: true,
    });
  }

  getAll(count = 10, offset = 0): Promise<AlbumModel[]> {
    return this.albumRepository.findAll({
      limit: count,
      offset,
      subQuery: false,
      attributes: {
        include: [[Sequelize.literal('"author"."name"'), 'authorName']],
      },
      include: [{ model: AuthorModel, attributes: [] }],
    });
  }

  async getOne(id: number): Promise<AlbumModel> {
    const album = await this.albumRepository.findByPk(id, {
      subQuery: false,
      attributes: {
        include: [[Sequelize.literal('"author"."name"'), 'authorName']],
      },
      include: [
        { model: AuthorModel, attributes: [] },
        {
          model: TrackModel,
          through: { attributes: [] },
          include: [{ model: AuthorModel, attributes: [] }],
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
    return album;
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
