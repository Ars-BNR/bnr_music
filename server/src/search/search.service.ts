import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, QueryTypes, Sequelize } from 'sequelize';
import { AlbumModel } from 'src/album/model/album.model';
import { mapAlbumModel } from 'src/album/album.mapper';
import { AuthorModel } from 'src/author/model/author.model';
import { GenreModel } from 'src/genre/model/genre.model';
import { PlaylistModel } from 'src/playlist/model/playlist.model';
import { PlaylistTrackModel } from 'src/playlist-track/model/playlist-track.model';
import { TrackModel } from 'src/track/model/track.model';
import { mapTrackModel } from 'src/track/track.mapper';
import { UserModel } from 'src/user/model/user.model';
import { SearchType } from './dto/search-query.dto';

type RankedRow = { id: number; total: number | string };

const SEARCH_SQL: Record<SearchType, string> = {
  [SearchType.Tracks]: `
    SELECT t."id", t."name" AS sort_name, t."listens" AS popularity
    FROM "tracks" t
    JOIN "authors" a ON a."id" = t."authorId"
    WHERE t."name" ILIKE :contains OR a."name" ILIKE :contains
      OR similarity(lower(t."name"), lower(:query)) >= 0.25
      OR similarity(lower(a."name"), lower(:query)) >= 0.25
      OR EXISTS (SELECT 1 FROM "track_featured_authors" tfa JOIN "authors" fa ON fa."id" = tfa."authorId" WHERE tfa."trackId" = t."id" AND (fa."name" ILIKE :contains OR similarity(lower(fa."name"), lower(:query)) >= 0.25))
      OR EXISTS (SELECT 1 FROM "album_tracks" at JOIN "albums" al ON al."id" = at."albumId" WHERE at."trackId" = t."id" AND (al."name" ILIKE :contains OR similarity(lower(al."name"), lower(:query)) >= 0.25))
      OR EXISTS (SELECT 1 FROM "track_genres" tg JOIN "genres" g ON g."id" = tg."genreId" WHERE tg."trackId" = t."id" AND (g."name" ILIKE :contains OR similarity(lower(g."name"), lower(:query)) >= 0.25))`,
  [SearchType.Authors]: `
    SELECT a."id", a."name" AS sort_name, 0 AS popularity FROM "authors" a
    WHERE a."name" ILIKE :contains OR similarity(lower(a."name"), lower(:query)) >= 0.25`,
  [SearchType.Albums]: `
    SELECT al."id", al."name" AS sort_name, al."listens" AS popularity
    FROM "albums" al JOIN "authors" a ON a."id" = al."authorId"
    WHERE al."name" ILIKE :contains OR a."name" ILIKE :contains
      OR similarity(lower(al."name"), lower(:query)) >= 0.25
      OR similarity(lower(a."name"), lower(:query)) >= 0.25
      OR EXISTS (SELECT 1 FROM "album_featured_authors" afa JOIN "authors" fa ON fa."id" = afa."authorId" WHERE afa."albumId" = al."id" AND (fa."name" ILIKE :contains OR similarity(lower(fa."name"), lower(:query)) >= 0.25))`,
  [SearchType.Genres]: `
    SELECT g."id", g."name" AS sort_name, 0 AS popularity FROM "genres" g
    WHERE g."name" ILIKE :contains OR similarity(lower(g."name"), lower(:query)) >= 0.25`,
  [SearchType.Playlists]: `
    SELECT p."id", p."name" AS sort_name,
      (SELECT COUNT(*) FROM "playlist_tracks" pt WHERE pt."playlistId" = p."id") AS popularity
    FROM "playlists" p
    WHERE p."name" ILIKE :contains OR similarity(lower(p."name"), lower(:query)) >= 0.25`,
};

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(TrackModel) private readonly tracks: typeof TrackModel,
    @InjectModel(AuthorModel) private readonly authors: typeof AuthorModel,
    @InjectModel(AlbumModel) private readonly albums: typeof AlbumModel,
    @InjectModel(GenreModel) private readonly genres: typeof GenreModel,
    @InjectModel(PlaylistModel)
    private readonly playlists: typeof PlaylistModel,
    @InjectModel(PlaylistTrackModel)
    private readonly playlistTracks: typeof PlaylistTrackModel,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

  private async rankedIds(
    type: SearchType,
    query: string,
    count: number,
    offset: number,
  ): Promise<{ ids: number[]; total: number }> {
    const source = SEARCH_SQL[type];
    const sql = `WITH candidates AS (${source}), ranked AS (
      SELECT DISTINCT "id", sort_name, popularity,
        CASE
          WHEN lower(sort_name) = lower(:query) THEN 0
          WHEN lower(sort_name) LIKE lower(:prefix) THEN 1
          WHEN lower(sort_name) LIKE lower(:contains) THEN 2
          ELSE 3
        END AS match_rank,
        similarity(lower(sort_name), lower(:query)) AS match_similarity
      FROM candidates
    )
    SELECT "id", COUNT(*) OVER() AS total FROM ranked
    ORDER BY match_rank ASC, match_similarity DESC, popularity DESC, lower(sort_name) ASC, "id" ASC
    LIMIT :count OFFSET :offset`;
    const replacements = {
      query,
      prefix: `${query}%`,
      contains: `%${query}%`,
      count,
      offset,
    };
    const rows = await this.sequelize.query<RankedRow>(sql, {
      replacements,
      type: QueryTypes.SELECT,
    });
    if (rows.length) {
      return {
        ids: rows.map((row) => Number(row.id)),
        total: Number(rows[0].total),
      };
    }
    const totals = await this.sequelize.query<{ total: number | string }>(
      `WITH candidates AS (${source}) SELECT COUNT(DISTINCT "id") AS total FROM candidates`,
      { replacements, type: QueryTypes.SELECT },
    );
    return { ids: [], total: Number(totals[0]?.total ?? 0) };
  }

  private restoreOrder<T extends { id: number }>(ids: number[], items: T[]) {
    const byId = new Map(items.map((item) => [item.id, item]));
    return ids.flatMap((id) => {
      const item = byId.get(id);
      return item ? [item] : [];
    });
  }

  private async load(type: SearchType, ids: number[]) {
    if (!ids.length) return [];
    if (type === SearchType.Tracks) {
      const rows = await this.tracks.findAll({
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
      });
      return this.restoreOrder(ids, rows.map(mapTrackModel));
    }
    if (type === SearchType.Albums) {
      const rows = await this.albums.findAll({
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
      return this.restoreOrder(ids, rows.map(mapAlbumModel));
    }
    if (type === SearchType.Authors) {
      const rows = await this.authors.findAll({
        where: { id: { [Op.in]: ids } },
      });
      return this.restoreOrder(
        ids,
        rows.map((row) => row.get({ plain: true })),
      );
    }
    if (type === SearchType.Genres) {
      const rows = await this.genres.findAll({
        where: { id: { [Op.in]: ids } },
      });
      return this.restoreOrder(
        ids,
        rows.map((row) => row.get({ plain: true })),
      );
    }
    const rows = await this.playlists.findAll({
      where: { id: { [Op.in]: ids } },
      include: [
        { model: UserModel, as: 'user', attributes: ['displayName', 'email'] },
      ],
    });
    const counts = (await this.playlistTracks.findAll({
      attributes: [
        'playlistId',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'trackCount'],
      ],
      where: { playlistId: { [Op.in]: ids } },
      group: ['playlistId'],
      raw: true,
    })) as unknown as Array<{
      playlistId: number;
      trackCount: string | number;
    }>;
    const countsById = new Map(
      counts.map((row) => [Number(row.playlistId), Number(row.trackCount)]),
    );
    return this.restoreOrder(
      ids,
      rows.map((row) => {
        const playlist = row.get({ plain: true }) as PlaylistModel & {
          user?: UserModel;
        };
        return {
          id: playlist.id,
          name: playlist.name,
          trackCount: countsById.get(playlist.id) ?? 0,
          ownerName: playlist.user?.displayName || playlist.user?.email || '',
        };
      }),
    );
  }

  async searchType(type: SearchType, query: string, count = 20, offset = 0) {
    const { ids, total } = await this.rankedIds(type, query, count, offset);
    return { items: await this.load(type, ids), total };
  }

  async preview(query: string, count = 5) {
    const entries = await Promise.all(
      Object.values(SearchType).map(
        async (type) =>
          [type, await this.searchType(type, query, count, 0)] as const,
      ),
    );
    return Object.fromEntries(entries) as Record<
      SearchType,
      { items: unknown[]; total: number }
    >;
  }
}
