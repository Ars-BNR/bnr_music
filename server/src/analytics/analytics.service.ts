import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { QueryTypes, Sequelize } from 'sequelize';
import { AnalyticsPeriod, AnalyticsQueryDto } from './dto/analytics-query.dto';

interface RawRankedRow {
  id: number;
  name: string;
  listens: string | number;
  trackId?: number;
  trackName?: string;
  genreId?: number;
  genreName?: string;
  albumId?: number;
  albumName?: string;
  authorId?: number;
  authorName?: string;
}

const periodDays: Record<Exclude<AnalyticsPeriod, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

@Injectable()
export class AnalyticsService {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  private playsCte(period: AnalyticsPeriod) {
    return period === 'all'
      ? `plays AS (
          SELECT t.id AS "trackId", GREATEST(COALESCE(t.listens, 0), 0)::bigint AS listens
          FROM tracks t
        )`
      : `plays AS (
          SELECT t.id AS "trackId", COUNT(pe.id)::bigint AS listens
          FROM tracks t
          LEFT JOIN play_events pe ON pe."trackId" = t.id AND pe."playedAt" >= :since
          GROUP BY t.id
        )`;
  }

  private async rankedQuery(
    sql: string,
    period: AnalyticsPeriod,
    since: Date | null,
    limit: number,
  ) {
    return this.sequelize.query<RawRankedRow>(
      `WITH ${this.playsCte(period)} ${sql}`,
      {
        replacements: { since, limit },
        type: QueryTypes.SELECT,
      },
    );
  }

  private normalize(rows: RawRankedRow[]) {
    return rows.map((row) => ({ ...row, listens: Number(row.listens) }));
  }

  async getDashboard(query: AnalyticsQueryDto) {
    const since =
      query.period === 'all'
        ? null
        : new Date(Date.now() - periodDays[query.period] * 86_400_000);
    const [tracking] = await this.sequelize.query<{
      trackingSince: Date | null;
    }>('SELECT MIN("playedAt") AS "trackingSince" FROM play_events', {
      type: QueryTypes.SELECT,
    });
    const [
      popularTracksByGenre,
      popularTracksByAlbum,
      popularGenres,
      popularAuthors,
      popularAlbumsByAuthor,
      popularAlbumTracksByAuthor,
    ] = await Promise.all([
      this.rankedQuery(
        `SELECT g.id, g.name, g.id AS "genreId", g.name AS "genreName",
                t.id AS "trackId", t.name AS "trackName", p.listens
         FROM plays p JOIN tracks t ON t.id = p."trackId"
         JOIN track_genres tg ON tg."trackId" = t.id
         JOIN genres g ON g.id = tg."genreId"
         WHERE p.listens > 0
         ORDER BY p.listens DESC, g.name ASC, t.name ASC, g.id ASC, t.id ASC
         LIMIT :limit`,
        query.period,
        since,
        query.limit,
      ),
      this.rankedQuery(
        `SELECT a.id, a.name, a.id AS "albumId", a.name AS "albumName",
                t.id AS "trackId", t.name AS "trackName", p.listens
         FROM plays p JOIN tracks t ON t.id = p."trackId"
         JOIN album_tracks at ON at."trackId" = t.id
         JOIN albums a ON a.id = at."albumId"
         WHERE p.listens > 0
         ORDER BY p.listens DESC, a.name ASC, t.name ASC, a.id ASC, t.id ASC
         LIMIT :limit`,
        query.period,
        since,
        query.limit,
      ),
      this.rankedQuery(
        `SELECT g.id, g.name, SUM(p.listens)::bigint AS listens
         FROM plays p JOIN track_genres tg ON tg."trackId" = p."trackId"
         JOIN genres g ON g.id = tg."genreId"
         GROUP BY g.id, g.name HAVING SUM(p.listens) > 0
         ORDER BY listens DESC, g.name ASC, g.id ASC LIMIT :limit`,
        query.period,
        since,
        query.limit,
      ),
      this.rankedQuery(
        `, author_credits AS (
           SELECT t.id AS "trackId", t."authorId" AS "authorId" FROM tracks t
           UNION
           SELECT tfa."trackId", tfa."authorId" FROM track_featured_authors tfa
         )
         SELECT a.id, a.name, SUM(p.listens)::bigint AS listens
         FROM plays p JOIN author_credits ac ON ac."trackId" = p."trackId"
         JOIN authors a ON a.id = ac."authorId"
         GROUP BY a.id, a.name HAVING SUM(p.listens) > 0
         ORDER BY listens DESC, a.name ASC, a.id ASC LIMIT :limit`,
        query.period,
        since,
        query.limit,
      ),
      this.rankedQuery(
        `, album_credits AS (
           SELECT a.id AS "albumId", a."authorId" FROM albums a
           UNION
           SELECT afa."albumId", afa."authorId" FROM album_featured_authors afa
         ), album_plays AS (
           SELECT at."albumId", SUM(p.listens)::bigint AS listens
           FROM album_tracks at JOIN plays p ON p."trackId" = at."trackId"
           GROUP BY at."albumId"
         )
         SELECT a.id, a.name, a.id AS "albumId", a.name AS "albumName",
                au.id AS "authorId", au.name AS "authorName", ap.listens
         FROM album_plays ap JOIN albums a ON a.id = ap."albumId"
         JOIN album_credits ac ON ac."albumId" = a.id
         JOIN authors au ON au.id = ac."authorId"
         WHERE ap.listens > 0
         ORDER BY ap.listens DESC, au.name ASC, a.name ASC, au.id ASC, a.id ASC
         LIMIT :limit`,
        query.period,
        since,
        query.limit,
      ),
      this.rankedQuery(
        `, album_credits AS (
           SELECT a.id AS "albumId", a."authorId" FROM albums a
           UNION
           SELECT afa."albumId", afa."authorId" FROM album_featured_authors afa
         )
         SELECT t.id, t.name, t.id AS "trackId", t.name AS "trackName",
                a.id AS "albumId", a.name AS "albumName",
                au.id AS "authorId", au.name AS "authorName", p.listens
         FROM plays p JOIN tracks t ON t.id = p."trackId"
         JOIN album_tracks at ON at."trackId" = t.id
         JOIN albums a ON a.id = at."albumId"
         JOIN album_credits ac ON ac."albumId" = a.id
         JOIN authors au ON au.id = ac."authorId"
         WHERE p.listens > 0
         ORDER BY p.listens DESC, au.name ASC, a.name ASC, t.name ASC,
                  au.id ASC, a.id ASC, t.id ASC LIMIT :limit`,
        query.period,
        since,
        query.limit,
      ),
    ]);

    return {
      period: query.period,
      trackingSince: tracking?.trackingSince
        ? new Date(tracking.trackingSince).toISOString()
        : null,
      generatedAt: new Date().toISOString(),
      popularTracksByGenre: this.normalize(popularTracksByGenre),
      popularTracksByAlbum: this.normalize(popularTracksByAlbum),
      popularGenres: this.normalize(popularGenres),
      popularAuthors: this.normalize(popularAuthors),
      popularAlbumsByAuthor: this.normalize(popularAlbumsByAuthor),
      popularAlbumTracksByAuthor: this.normalize(popularAlbumTracksByAuthor),
    };
  }
}
