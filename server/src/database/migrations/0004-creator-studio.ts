import { QueryInterface } from 'sequelize';
import { MigrationParams } from 'umzug';

export const name = '0004-creator-studio';

export async function up({
  context,
}: MigrationParams<QueryInterface>): Promise<void> {
  await context.sequelize.transaction(async (transaction) => {
    await context.sequelize.query(
      'ALTER TABLE "authors" ADD COLUMN IF NOT EXISTS "userId" INTEGER',
      { transaction },
    );
    await context.sequelize.query(
      'ALTER TABLE "authors" ADD COLUMN IF NOT EXISTS "bio" VARCHAR(500) NOT NULL DEFAULT \'\'',
      { transaction },
    );
    await context.sequelize.query(
      'ALTER TABLE "authors" ADD COLUMN IF NOT EXISTS "avatar" VARCHAR(255)',
      { transaction },
    );
    await context.sequelize.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "authors_userId_unique" ON "authors" ("userId") WHERE "userId" IS NOT NULL',
      { transaction },
    );
    const authorForeignKeys = (await context.getForeignKeyReferencesForTable(
      'authors',
      { transaction },
    )) as Array<{ constraintName?: string }>;
    if (
      !authorForeignKeys.some(
        (key) => key.constraintName === 'authors_userId_fkey',
      )
    ) {
      await context.sequelize.query(
        'ALTER TABLE "authors" ADD CONSTRAINT "authors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL',
        { transaction },
      );
    }

    await context.sequelize.query(
      `CREATE TABLE IF NOT EXISTS "author_applications" (
      "id" SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
      "stageName" VARCHAR(80) NOT NULL,
      "bio" VARCHAR(500) NOT NULL,
      "avatar" VARCHAR(255) NOT NULL,
      "status" VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'approved', 'rejected')),
      "reviewNote" VARCHAR(500),
      "reviewedBy" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
      "reviewedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
      { transaction },
    );

    await context.sequelize.query(
      `CREATE TABLE IF NOT EXISTS "track_featured_authors" (
      "id" SERIAL PRIMARY KEY,
      "trackId" INTEGER NOT NULL REFERENCES "tracks"("id") ON DELETE CASCADE,
      "authorId" INTEGER NOT NULL REFERENCES "authors"("id") ON DELETE CASCADE,
      "position" SMALLINT NOT NULL,
      UNIQUE ("trackId", "authorId")
    )`,
      { transaction },
    );
    await context.sequelize.query(
      `CREATE TABLE IF NOT EXISTS "album_featured_authors" (
      "id" SERIAL PRIMARY KEY,
      "albumId" INTEGER NOT NULL REFERENCES "albums"("id") ON DELETE CASCADE,
      "authorId" INTEGER NOT NULL REFERENCES "authors"("id") ON DELETE CASCADE,
      "position" SMALLINT NOT NULL,
      UNIQUE ("albumId", "authorId")
    )`,
      { transaction },
    );
    await context.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "track_featured_authors_authorId_idx" ON "track_featured_authors" ("authorId")',
      { transaction },
    );
    await context.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "album_featured_authors_authorId_idx" ON "album_featured_authors" ("authorId")',
      { transaction },
    );
  });
}

export async function down({
  context,
}: MigrationParams<QueryInterface>): Promise<void> {
  await context.sequelize.transaction(async (transaction) => {
    await context.sequelize.query(
      'DROP TABLE IF EXISTS "track_featured_authors"',
      { transaction },
    );
    await context.sequelize.query(
      'DROP TABLE IF EXISTS "album_featured_authors"',
      { transaction },
    );
    await context.sequelize.query(
      'DROP TABLE IF EXISTS "author_applications"',
      { transaction },
    );
    await context.sequelize.query(
      'DROP INDEX IF EXISTS "authors_userId_unique"',
      { transaction },
    );
    await context.sequelize.query(
      'ALTER TABLE "authors" DROP COLUMN IF EXISTS "avatar"',
      { transaction },
    );
    await context.sequelize.query(
      'ALTER TABLE "authors" DROP COLUMN IF EXISTS "bio"',
      { transaction },
    );
    await context.sequelize.query(
      'ALTER TABLE "authors" DROP COLUMN IF EXISTS "userId"',
      { transaction },
    );
  });
}
