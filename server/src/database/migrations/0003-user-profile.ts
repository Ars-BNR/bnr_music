import { QueryInterface } from 'sequelize';
import { MigrationParams } from 'umzug';

export const name = '0003-user-profile';

export async function up({
  context,
}: MigrationParams<QueryInterface>): Promise<void> {
  await context.sequelize.transaction(async (transaction) => {
    await context.sequelize.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "displayName" VARCHAR(80)',
      { transaction },
    );
    await context.sequelize.query(
      `UPDATE "users"
       SET "displayName" = COALESCE(NULLIF(split_part("email", '@', 1), ''), 'BNR')
       WHERE "displayName" IS NULL OR "displayName" = ''`,
      { transaction },
    );
    await context.sequelize.query(
      'ALTER TABLE "users" ALTER COLUMN "displayName" SET DEFAULT \'\'',
      { transaction },
    );
    await context.sequelize.query(
      'ALTER TABLE "users" ALTER COLUMN "displayName" SET NOT NULL',
      { transaction },
    );
    await context.sequelize.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" VARCHAR(280) NOT NULL DEFAULT \'\'',
      { transaction },
    );
    await context.sequelize.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar" VARCHAR(255)',
      { transaction },
    );
  });
}

export async function down({
  context,
}: MigrationParams<QueryInterface>): Promise<void> {
  await context.sequelize.transaction(async (transaction) => {
    await context.sequelize.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "avatar"',
      { transaction },
    );
    await context.sequelize.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "bio"',
      { transaction },
    );
    await context.sequelize.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "displayName"',
      { transaction },
    );
  });
}
