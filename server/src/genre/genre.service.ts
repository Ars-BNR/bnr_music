import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AlbumModel } from 'src/album/model/album.model';
import { AuthorModel } from 'src/author/model/author.model';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { TrackModel } from 'src/track/model/track.model';
import { GenreModel } from './model/genre.model';

export interface GenreTracksResponse {
  genre: Pick<GenreModel, 'id' | 'name'>;
  tracks: Array<{
    id: number;
    name: string;
    picture: string;
    text: string;
    listens: number;
    audio: string;
    authorId: number;
    authorName: string;
    albumId?: number;
  }>;
  total: number;
}

@Injectable()
export class GenreService {
  constructor(
    @InjectModel(GenreModel)
    private readonly genreRepository: typeof GenreModel,
    @InjectModel(TrackModel)
    private readonly trackRepository: typeof TrackModel,
  ) {}

  async getOne(id: number): Promise<GenreModel> {
    const genre = await this.genreRepository.findByPk(id);
    if (!genre) throw new NotFoundException('Genre not found');
    return genre;
  }

  getAll(count = 10, offset = 0): Promise<GenreModel[]> {
    return this.genreRepository.findAll({ limit: count, offset });
  }

  async getTracks(
    id: number,
    pagination: PaginationQueryDto,
  ): Promise<GenreTracksResponse> {
    const genre = await this.getOne(id);
    const { count, rows } = await this.trackRepository.findAndCountAll({
      distinct: true,
      limit: pagination.count,
      offset: pagination.offset,
      include: [
        {
          model: GenreModel,
          where: { id },
          attributes: [],
          through: { attributes: [] },
          required: true,
        },
        { model: AuthorModel, attributes: ['id', 'name'], required: true },
        {
          model: AlbumModel,
          attributes: ['id'],
          through: { attributes: [] },
          required: false,
        },
      ],
      order: [['id', 'ASC']],
    });

    return {
      genre: { id: genre.id, name: genre.name },
      tracks: rows.map((track) => {
        const value = track.get({ plain: true }) as TrackModel;
        return {
          id: value.id,
          name: value.name,
          picture: value.picture,
          text: value.text,
          listens: value.listens,
          audio: value.audio,
          authorId: value.authorId,
          authorName: value.author?.name ?? '',
          albumId: value.albums?.[0]?.id,
        };
      }),
      total: count,
    };
  }
}
