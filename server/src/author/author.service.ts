import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes, Sequelize } from 'sequelize';
import { AlbumModel } from 'src/album/model/album.model';
import { TrackModel } from 'src/track/model/track.model';
import { AuthorModel } from './model/author.model';
import { mapTrackModel } from 'src/track/track.mapper';
import { mapAlbumModel } from 'src/album/album.mapper';

@Injectable()
export class AuthorService {
  constructor(
    @InjectModel(AuthorModel)
    private readonly authorRepository: typeof AuthorModel,
    @InjectModel(TrackModel)
    private readonly trackRepository: typeof TrackModel,
    @InjectModel(AlbumModel)
    private readonly albumRepository: typeof AlbumModel,
    @InjectConnection() private readonly sequelize: Sequelize,
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
    const [page, totals] = await Promise.all([
      this.sequelize.query<{ id: number }>(
        `SELECT t."id" FROM "tracks" t
         WHERE t."authorId" = :authorId OR EXISTS (
           SELECT 1 FROM "track_featured_authors" relation
           WHERE relation."trackId" = t."id" AND relation."authorId" = :authorId
         )
         ORDER BY t."id" ASC LIMIT :count OFFSET :offset`,
        {
          replacements: { authorId: id, count, offset },
          type: QueryTypes.SELECT,
        },
      ),
      this.sequelize.query<{ total: number | string }>(
        `SELECT COUNT(*) AS total FROM "tracks" t
         WHERE t."authorId" = :authorId OR EXISTS (
           SELECT 1 FROM "track_featured_authors" relation
           WHERE relation."trackId" = t."id" AND relation."authorId" = :authorId
         )`,
        { replacements: { authorId: id }, type: QueryTypes.SELECT },
      ),
    ]);
    const ids = page.map((row) => Number(row.id));
    const rows = ids.length
      ? await this.trackRepository.findAll({
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
            {
              model: AlbumModel,
              as: 'albums',
              attributes: ['id', 'name'],
              through: { attributes: ['position'] },
              required: false,
            },
          ],
        })
      : [];
    const byId = new Map(rows.map((row) => [row.id, mapTrackModel(row)]));
    const tracks = ids.flatMap((trackId) =>
      byId.has(trackId) ? [byId.get(trackId)!] : [],
    );
    return { tracks, total: Number(totals[0]?.total ?? 0) };
  }

  async getAlbums(id: number, count = 12, offset = 0) {
    await this.getOne(id);
    const [page, totals] = await Promise.all([
      this.sequelize.query<{ id: number }>(
        `SELECT album."id" FROM "albums" album
         WHERE album."authorId" = :authorId OR EXISTS (
           SELECT 1 FROM "album_featured_authors" relation
           WHERE relation."albumId" = album."id" AND relation."authorId" = :authorId
         )
         ORDER BY album."id" ASC LIMIT :count OFFSET :offset`,
        {
          replacements: { authorId: id, count, offset },
          type: QueryTypes.SELECT,
        },
      ),
      this.sequelize.query<{ total: number | string }>(
        `SELECT COUNT(*) AS total FROM "albums" album
         WHERE album."authorId" = :authorId OR EXISTS (
           SELECT 1 FROM "album_featured_authors" relation
           WHERE relation."albumId" = album."id" AND relation."authorId" = :authorId
         )`,
        { replacements: { authorId: id }, type: QueryTypes.SELECT },
      ),
    ]);
    const ids = page.map((row) => Number(row.id));
    const rows = ids.length
      ? await this.albumRepository.findAll({
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
        })
      : [];
    const byId = new Map(rows.map((row) => [row.id, mapAlbumModel(row)]));
    const albums = ids.flatMap((albumId) =>
      byId.has(albumId) ? [byId.get(albumId)!] : [],
    );
    return { albums, total: Number(totals[0]?.total ?? 0) };
  }
}
