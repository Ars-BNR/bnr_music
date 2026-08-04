import { QueryInterface } from 'sequelize';
import { MigrationParams } from 'umzug';

export const name = '0002-security-and-constraints';

const relations = [
  ['album_tracks', 'albumId', 'trackId'],
  ['playlist_tracks', 'playlistId', 'trackId'],
  ['collection_tracks', 'collectionId', 'trackId'],
  ['collection_albums', 'collectionId', 'albumId'],
  ['collection_playlists', 'collectionId', 'playlistId'],
  ['track_genres', 'trackId', 'genreId'],
] as const;

export async function up({
  context,
}: MigrationParams<QueryInterface>): Promise<void> {
  await context.sequelize.transaction(async (transaction) => {
    await context.sequelize.query(
      `ALTER TABLE "users" ALTER COLUMN "isActivated" TYPE BOOLEAN
       USING CASE WHEN lower(COALESCE("isActivated"::text, 'false')) IN ('true', '1', 'yes') THEN TRUE ELSE FALSE END`,
      { transaction },
    );
    await context.sequelize.query(
      'ALTER TABLE "users" ALTER COLUMN "isActivated" SET DEFAULT FALSE',
      { transaction },
    );
    await context.sequelize.query(
      'ALTER TABLE "users" ALTER COLUMN "isActivated" SET NOT NULL',
      { transaction },
    );

    // Existing entries contain plaintext refresh tokens and must not survive the security transition.
    await context.sequelize.query('DELETE FROM "tokens"', { transaction });

    for (const [table, firstColumn, secondColumn] of relations) {
      await context.sequelize.query(
        `DELETE FROM "${table}" AS duplicate
         USING "${table}" AS original
         WHERE duplicate."id" > original."id"
           AND duplicate."${firstColumn}" = original."${firstColumn}"
           AND duplicate."${secondColumn}" = original."${secondColumn}"`,
        { transaction },
      );
      await context.addIndex(table, [firstColumn, secondColumn], {
        unique: true,
        name: `${table}_${firstColumn}_${secondColumn}_unique`,
        transaction,
      });
    }
  });
}

export async function down({
  context,
}: MigrationParams<QueryInterface>): Promise<void> {
  for (const [table, firstColumn, secondColumn] of relations) {
    await context.removeIndex(
      table,
      `${table}_${firstColumn}_${secondColumn}_unique`,
    );
  }
}
