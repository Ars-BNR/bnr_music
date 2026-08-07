import { DataTypes, QueryInterface, QueryTypes } from 'sequelize';
import { MigrationParams } from 'umzug';

export const name = '0007-catalog-search-and-bulk';

async function hasColumn(
  context: QueryInterface,
  table: string,
  column: string,
): Promise<boolean> {
  const columns = await context.describeTable(table);
  return Object.prototype.hasOwnProperty.call(columns, column);
}

export async function up({
  context,
}: MigrationParams<QueryInterface>): Promise<void> {
  try {
    await context.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
  } catch (error) {
    throw new Error(
      `Migration 0007 requires permission to install PostgreSQL extension pg_trgm: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  await context.sequelize.transaction(async (transaction) => {
    if (!(await hasColumn(context, 'album_tracks', 'position'))) {
      await context.addColumn(
        'album_tracks',
        'position',
        { type: DataTypes.INTEGER, allowNull: true },
        { transaction },
      );
    }
    await context.sequelize.query(
      `WITH ordered AS (
         SELECT "id", ROW_NUMBER() OVER (
           PARTITION BY "albumId" ORDER BY "id" ASC
         ) - 1 AS next_position
         FROM "album_tracks"
       )
       UPDATE "album_tracks" AS target
       SET "position" = ordered.next_position
       FROM ordered
       WHERE target."id" = ordered."id" AND target."position" IS NULL`,
      { transaction },
    );
    await context.changeColumn(
      'album_tracks',
      'position',
      { type: DataTypes.INTEGER, allowNull: false },
      { transaction },
    );
    await context.sequelize.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "album_tracks_album_position_unique" ON "album_tracks" ("albumId", "position")',
      { transaction },
    );
    await context.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "album_tracks_trackId_idx" ON "album_tracks" ("trackId")',
      { transaction },
    );

    for (const table of ['tracks', 'albums']) {
      if (!(await hasColumn(context, table, 'creatorRequestId'))) {
        await context.addColumn(
          table,
          'creatorRequestId',
          { type: DataTypes.UUID, allowNull: true },
          { transaction },
        );
      }
      await context.sequelize.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS "${table}_author_creator_request_unique" ON "${table}" ("authorId", "creatorRequestId")`,
        { transaction },
      );
    }

    for (const [table, index] of [
      ['tracks', 'tracks_name_trgm_idx'],
      ['authors', 'authors_name_trgm_idx'],
      ['albums', 'albums_name_trgm_idx'],
      ['genres', 'genres_name_trgm_idx'],
      ['playlists', 'playlists_name_trgm_idx'],
    ] as const) {
      await context.sequelize.query(
        `CREATE INDEX IF NOT EXISTS "${index}" ON "${table}" USING gin (lower("name") gin_trgm_ops)`,
        { transaction },
      );
    }
  });
}

export async function down({
  context,
}: MigrationParams<QueryInterface>): Promise<void> {
  await context.sequelize.transaction(async (transaction) => {
    for (const index of [
      'tracks_name_trgm_idx',
      'authors_name_trgm_idx',
      'albums_name_trgm_idx',
      'genres_name_trgm_idx',
      'playlists_name_trgm_idx',
      'album_tracks_album_position_unique',
      'album_tracks_trackId_idx',
      'tracks_author_creator_request_unique',
      'albums_author_creator_request_unique',
    ]) {
      await context.sequelize.query(`DROP INDEX IF EXISTS "${index}"`, {
        transaction,
      });
    }
    for (const table of ['tracks', 'albums']) {
      if (await hasColumn(context, table, 'creatorRequestId')) {
        await context.removeColumn(table, 'creatorRequestId', { transaction });
      }
    }
    if (await hasColumn(context, 'album_tracks', 'position')) {
      await context.removeColumn('album_tracks', 'position', { transaction });
    }
  });
}

export async function verify(
  context: QueryInterface,
): Promise<{ indexes: string[] }> {
  const rows = await context.sequelize.query<{ indexname: string }>(
    `SELECT indexname FROM pg_indexes
     WHERE schemaname = current_schema()
       AND indexname LIKE '%trgm_idx'`,
    { type: QueryTypes.SELECT },
  );
  return { indexes: rows.map((row) => row.indexname) };
}
