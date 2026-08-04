import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AlbumModel } from 'src/album/model/album.model';
import { AuthorModel } from 'src/author/model/author.model';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { TrackModel } from 'src/track/model/track.model';
import { TrackGenreModel } from 'src/track-genre/model/track-genre.model';
import { Op } from 'sequelize';
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
    featuredAuthors: Array<{
      id: number;
      name: string;
      avatar: string | null;
    }>;
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
    @InjectModel(TrackGenreModel)
    private readonly trackGenreRepository: typeof TrackGenreModel,
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
    const [relations, total] = await Promise.all([
      this.trackGenreRepository.findAll({
        where: { genreId: id },
        attributes: ['trackId'],
        order: [['id', 'ASC']],
        limit: pagination.count,
        offset: pagination.offset,
      }),
      this.trackGenreRepository.count({
        where: { genreId: id },
        distinct: true,
        col: 'trackId',
      }),
    ]);
    const trackIds = [
      ...new Set(relations.map((relation) => relation.trackId)),
    ];
    if (trackIds.length === 0) {
      return { genre: { id: genre.id, name: genre.name }, tracks: [], total };
    }

    const rows = await this.trackRepository.findAll({
      where: { id: { [Op.in]: trackIds } },
      include: [
        {
          model: AuthorModel,
          as: 'author',
          attributes: ['id', 'name', 'avatar'],
          required: true,
        },
        {
          model: AlbumModel,
          as: 'albums',
          attributes: ['id'],
          through: { attributes: [] },
          required: false,
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
    const tracksById = new Map(rows.map((track) => [track.id, track]));

    return {
      genre: { id: genre.id, name: genre.name },
      tracks: trackIds.flatMap((trackId) => {
        const track = tracksById.get(trackId);
        if (!track) return [];
        const value = track.get({ plain: true }) as TrackModel & {
          featuredAuthors?: AuthorModel[];
        };
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
          featuredAuthors:
            value.featuredAuthors?.map((author) => ({
              id: author.id,
              name: author.name,
              avatar: author.avatar ?? null,
            })) ?? [],
        };
      }),
      total,
    };
  }
}
