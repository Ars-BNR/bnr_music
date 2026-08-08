import { DataTypes, QueryInterface } from 'sequelize';
import { MigrationParams } from 'umzug';

export const name = '0008-creator-edit-and-user-admin';

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

async function hasTable(
  context: QueryInterface,
  table: string,
): Promise<boolean> {
  const tables = await context.showAllTables();
  return tables.includes(table);
}

export async function up({
  context,
}: MigrationParams<QueryInterface>): Promise<void> {
  const [
    hasAccountStatus,
    hasBlockedAt,
    hasDeletedAt,
    hasSessionVersion,
    hasResetTokens,
  ] = await Promise.all([
    hasColumn(context, 'users', 'accountStatus'),
    hasColumn(context, 'users', 'blockedAt'),
    hasColumn(context, 'users', 'deletedAt'),
    hasColumn(context, 'users', 'sessionVersion'),
    hasTable(context, 'password_reset_tokens'),
  ]);
  await context.sequelize.transaction(async (transaction) => {
    if (!hasAccountStatus)
      await context.addColumn(
        'users',
        'accountStatus',
        {
          type: DataTypes.STRING(16),
          allowNull: false,
          defaultValue: 'active',
        },
        { transaction },
      );
    if (!hasBlockedAt)
      await context.addColumn(
        'users',
        'blockedAt',
        { type: DataTypes.DATE, allowNull: true },
        { transaction },
      );
    if (!hasDeletedAt)
      await context.addColumn(
        'users',
        'deletedAt',
        { type: DataTypes.DATE, allowNull: true },
        { transaction },
      );
    if (!hasSessionVersion)
      await context.addColumn(
        'users',
        'sessionVersion',
        { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        { transaction },
      );
    await context.sequelize.query(
      'ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_account_status_check"',
      { transaction },
    );
    await context.sequelize.query(
      'ALTER TABLE "users" ADD CONSTRAINT "users_account_status_check" CHECK ("accountStatus" IN (\'active\', \'blocked\', \'deleted\'))',
      { transaction },
    );
    if (!hasResetTokens)
      await context.createTable(
        'password_reset_tokens',
        {
          id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
          userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
          },
          tokenHash: {
            type: DataTypes.STRING(64),
            allowNull: false,
            unique: true,
          },
          expiresAt: { type: DataTypes.DATE, allowNull: false },
          usedAt: { type: DataTypes.DATE, allowNull: true },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
          },
        },
        { transaction },
      );
    await context.sequelize.query(
      'CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_expiry_idx" ON "password_reset_tokens" ("userId", "expiresAt")',
      { transaction },
    );
    await context.sequelize.query(
      `INSERT INTO "permissions" ("code", "name", "description") VALUES ('users.manage', 'users.manage', 'System permission: users.manage') ON CONFLICT ("code") DO NOTHING`,
      { transaction },
    );
    await context.sequelize.query(
      `INSERT INTO "role_permissions" ("roleId", "permissionId") SELECT r.id, p.id FROM "roles" r CROSS JOIN "permissions" p WHERE r.code = 'admin' AND p.code = 'users.manage' ON CONFLICT ("roleId", "permissionId") DO NOTHING`,
      { transaction },
    );
  });
}

export async function down({
  context,
}: MigrationParams<QueryInterface>): Promise<void> {
  const [
    hasResetTokens,
    hasSessionVersion,
    hasDeletedAt,
    hasBlockedAt,
    hasAccountStatus,
  ] = await Promise.all([
    hasTable(context, 'password_reset_tokens'),
    hasColumn(context, 'users', 'sessionVersion'),
    hasColumn(context, 'users', 'deletedAt'),
    hasColumn(context, 'users', 'blockedAt'),
    hasColumn(context, 'users', 'accountStatus'),
  ]);
  await context.sequelize.transaction(async (transaction) => {
    if (hasResetTokens)
      await context.dropTable('password_reset_tokens', { transaction });
    await context.sequelize.query(
      'ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_account_status_check"',
      { transaction },
    );
    for (const [column, exists] of [
      ['sessionVersion', hasSessionVersion],
      ['deletedAt', hasDeletedAt],
      ['blockedAt', hasBlockedAt],
      ['accountStatus', hasAccountStatus],
    ] as const)
      if (exists) await context.removeColumn('users', column, { transaction });
  });
}
