import { QueryInterface, QueryTypes, Transaction } from 'sequelize';
import { MigrationParams } from 'umzug';

export const name = '0005-creator-studio-hardening';

async function addConstraintIfMissing(
  context: QueryInterface,
  table: string,
  constraint: string,
  sql: string,
  transaction: Transaction,
): Promise<void> {
  const constraints = await context.sequelize.query<{
    constraint_name: string;
  }>(
    `SELECT constraint_name FROM information_schema.table_constraints
     WHERE table_schema = current_schema() AND table_name = :table`,
    { replacements: { table }, transaction, type: QueryTypes.SELECT },
  );
  if (!constraints.some((item) => item.constraint_name === constraint)) {
    await context.sequelize.query(sql, { transaction });
  }
}

export async function up({
  context,
}: MigrationParams<QueryInterface>): Promise<void> {
  await context.sequelize.transaction(async (transaction) => {
    const options = { transaction };
    await context.sequelize.query(
      `DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM "author_applications"
          WHERE "status" NOT IN ('pending', 'approved', 'rejected') OR "status" IS NULL
        ) THEN RAISE EXCEPTION 'Invalid author application status'; END IF;
        IF EXISTS (
          SELECT 1 FROM "author_applications" GROUP BY "userId" HAVING COUNT(*) > 1
        ) THEN RAISE EXCEPTION 'Duplicate author applications require manual resolution'; END IF;
      END $$`,
      options,
    );

    await context.sequelize.query(
      `DELETE FROM "track_featured_authors" AS target
       USING (
         SELECT "id", ROW_NUMBER() OVER (
           PARTITION BY "trackId", "authorId" ORDER BY "id"
         ) AS row_number
         FROM "track_featured_authors"
       ) AS duplicates
       WHERE target."id" = duplicates."id" AND duplicates.row_number > 1`,
      options,
    );
    await context.sequelize.query(
      `DELETE FROM "album_featured_authors" AS target
       USING (
         SELECT "id", ROW_NUMBER() OVER (
           PARTITION BY "albumId", "authorId" ORDER BY "id"
         ) AS row_number
         FROM "album_featured_authors"
       ) AS duplicates
       WHERE target."id" = duplicates."id" AND duplicates.row_number > 1`,
      options,
    );

    await context.sequelize.query(
      'ALTER TABLE "author_applications" ALTER COLUMN "userId" SET NOT NULL',
      options,
    );
    await context.sequelize.query(
      'ALTER TABLE "author_applications" ALTER COLUMN "status" SET NOT NULL',
      options,
    );
    await context.sequelize.query(
      'ALTER TABLE "author_applications" ALTER COLUMN "status" SET DEFAULT \'pending\'',
      options,
    );
    await context.sequelize.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "author_applications_userId_unique" ON "author_applications" ("userId")',
      options,
    );
    await context.sequelize.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "track_featured_authors_track_author_unique" ON "track_featured_authors" ("trackId", "authorId")',
      options,
    );
    await context.sequelize.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "album_featured_authors_album_author_unique" ON "album_featured_authors" ("albumId", "authorId")',
      options,
    );
    await context.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "track_featured_authors_authorId_idx" ON "track_featured_authors" ("authorId")',
      options,
    );
    await context.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "album_featured_authors_authorId_idx" ON "album_featured_authors" ("authorId")',
      options,
    );

    await addConstraintIfMissing(
      context,
      'author_applications',
      'author_applications_status_check',
      'ALTER TABLE "author_applications" ADD CONSTRAINT "author_applications_status_check" CHECK ("status" IN (\'pending\', \'approved\', \'rejected\'))',
      transaction,
    );
    await addConstraintIfMissing(
      context,
      'track_featured_authors',
      'track_featured_authors_position_check',
      'ALTER TABLE "track_featured_authors" ADD CONSTRAINT "track_featured_authors_position_check" CHECK ("position" >= 0)',
      transaction,
    );
    await addConstraintIfMissing(
      context,
      'album_featured_authors',
      'album_featured_authors_position_check',
      'ALTER TABLE "album_featured_authors" ADD CONSTRAINT "album_featured_authors_position_check" CHECK ("position" >= 0)',
      transaction,
    );
  });
}

export async function down({
  context,
}: MigrationParams<QueryInterface>): Promise<void> {
  await context.sequelize.transaction(async (transaction) => {
    const options = { transaction };
    await context.sequelize.query(
      'ALTER TABLE "author_applications" DROP CONSTRAINT IF EXISTS "author_applications_status_check"',
      options,
    );
    await context.sequelize.query(
      'ALTER TABLE "track_featured_authors" DROP CONSTRAINT IF EXISTS "track_featured_authors_position_check"',
      options,
    );
    await context.sequelize.query(
      'ALTER TABLE "album_featured_authors" DROP CONSTRAINT IF EXISTS "album_featured_authors_position_check"',
      options,
    );
  });
}
