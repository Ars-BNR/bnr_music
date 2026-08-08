import { DataTypes, QueryInterface } from 'sequelize';
import { MigrationParams } from 'umzug';

export const name = '0011-mail-delivery-hardening';

const hasColumn = async (
  context: QueryInterface,
  column: string,
): Promise<boolean> => {
  const columns = await context.describeTable('users');
  return column in columns;
};

export async function up({ context }: MigrationParams<QueryInterface>) {
  const hasExpiresAt = await hasColumn(context, 'activationExpiresAt');
  const hasSentAt = await hasColumn(context, 'activationSentAt');
  await context.sequelize.transaction(async (transaction) => {
    if (!hasExpiresAt) {
      await context.addColumn(
        'users',
        'activationExpiresAt',
        { type: DataTypes.DATE, allowNull: true },
        { transaction },
      );
    }
    if (!hasSentAt) {
      await context.addColumn(
        'users',
        'activationSentAt',
        { type: DataTypes.DATE, allowNull: true },
        { transaction },
      );
    }
    await context.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "users_activation_link_idx" ON "users" ("activationLink") WHERE "activationLink" IS NOT NULL',
      { transaction },
    );
  });
}

export async function down({ context }: MigrationParams<QueryInterface>) {
  const hasExpiresAt = await hasColumn(context, 'activationExpiresAt');
  const hasSentAt = await hasColumn(context, 'activationSentAt');
  await context.sequelize.transaction(async (transaction) => {
    await context.sequelize.query(
      'DROP INDEX IF EXISTS "users_activation_link_idx"',
      { transaction },
    );
    if (hasSentAt)
      await context.removeColumn('users', 'activationSentAt', { transaction });
    if (hasExpiresAt)
      await context.removeColumn('users', 'activationExpiresAt', {
        transaction,
      });
  });
}
