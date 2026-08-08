import { DataTypes, QueryInterface } from 'sequelize';
import { MigrationParams } from 'umzug';

export const name = '0009-creator-remoderation-and-password-state';

async function hasColumn(
  context: QueryInterface,
  table: string,
  column: string,
) {
  return Object.prototype.hasOwnProperty.call(
    await context.describeTable(table),
    column,
  );
}

export async function up({
  context,
}: MigrationParams<QueryInterface>): Promise<void> {
  const exists = await hasColumn(context, 'users', 'mustChangePassword');
  await context.sequelize.transaction(async (transaction) => {
    if (!exists) {
      await context.addColumn(
        'users',
        'mustChangePassword',
        {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction },
      );
    }
    await context.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "author_applications_status_updated_idx" ON "author_applications" ("status", "updatedAt" DESC)',
      { transaction },
    );
    await context.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "password_reset_tokens_active_idx" ON "password_reset_tokens" ("userId", "expiresAt") WHERE "usedAt" IS NULL',
      { transaction },
    );
  });
}

export async function down({
  context,
}: MigrationParams<QueryInterface>): Promise<void> {
  const exists = await hasColumn(context, 'users', 'mustChangePassword');
  await context.sequelize.transaction(async (transaction) => {
    await context.sequelize.query(
      'DROP INDEX IF EXISTS "author_applications_status_updated_idx"',
      { transaction },
    );
    await context.sequelize.query(
      'DROP INDEX IF EXISTS "password_reset_tokens_active_idx"',
      { transaction },
    );
    if (exists)
      await context.removeColumn('users', 'mustChangePassword', {
        transaction,
      });
  });
}
