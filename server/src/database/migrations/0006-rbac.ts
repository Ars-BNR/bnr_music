import {
  DataTypes,
  QueryInterface,
  QueryTypes,
  Sequelize,
  Transaction,
} from 'sequelize';
import { MigrationParams } from 'umzug';

export const name = '0006-rbac';

const PERMISSION_CODES = [
  'profile.manage-own',
  'library.manage-own',
  'creator.apply',
  'creator.publish',
  'creator.moderate',
  'catalog.manage',
  'users.read',
  'rbac.manage',
] as const;

const SYSTEM_ROLE_PERMISSIONS: Record<
  'user' | 'author' | 'admin',
  readonly (typeof PERMISSION_CODES)[number][]
> = {
  user: ['profile.manage-own', 'library.manage-own', 'creator.apply'],
  author: ['creator.publish'],
  admin: PERMISSION_CODES,
};

const permissionLabels: Record<string, string> = {
  'profile.manage-own': 'Manage own profile',
  'library.manage-own': 'Manage own library',
  'creator.apply': 'Apply to become an author',
  'creator.publish': 'Publish creator releases',
  'creator.moderate': 'Moderate author applications',
  'catalog.manage': 'Manage public catalog',
  'users.read': 'Read users',
  'rbac.manage': 'Manage roles and access',
};

const RBAC_TABLES = [
  'roles',
  'permissions',
  'user_roles',
  'role_permissions',
] as const;

async function addIndexIfMissing(
  context: QueryInterface,
  table: string,
  fields: string[],
  name: string,
  transaction: Transaction,
  unique = false,
): Promise<void> {
  const indexes = (await context.showIndex(table, {
    transaction,
  })) as Array<{ name: string }>;
  if (indexes.some((index) => index.name === name)) return;
  await context.addIndex(table, fields, {
    name,
    unique,
    transaction,
  });
}

async function createSchema(
  context: QueryInterface,
  transaction: Transaction,
): Promise<void> {
  const timestamps = {
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
  };
  await context.createTable(
    'roles',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      code: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      description: {
        type: DataTypes.STRING(280),
        allowNull: false,
        defaultValue: '',
      },
      isSystem: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      ...timestamps,
    },
    { transaction },
  );
  await context.createTable(
    'permissions',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      code: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      description: {
        type: DataTypes.STRING(280),
        allowNull: false,
        defaultValue: '',
      },
      ...timestamps,
    },
    { transaction },
  );
  await context.createTable(
    'user_roles',
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'roles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    },
    { transaction },
  );
  await context.createTable(
    'role_permissions',
    {
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'roles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      permissionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'permissions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    },
    { transaction },
  );
}

export async function up({
  context,
}: MigrationParams<QueryInterface>): Promise<void> {
  await context.sequelize.transaction(async (transaction) => {
    const userColumns = await context.describeTable('users');
    const hasLegacyRole = Object.prototype.hasOwnProperty.call(
      userColumns,
      'role',
    );
    if (hasLegacyRole) {
      const invalidRoles = await context.sequelize.query<{
        role: string | null;
      }>(
        `SELECT DISTINCT "role" FROM "users"
         WHERE "role" IS NULL OR "role" NOT IN ('user', 'author', 'admin')`,
        { type: QueryTypes.SELECT, transaction },
      );
      if (invalidRoles.length) {
        throw new Error(
          `Unknown legacy user roles: ${invalidRoles
            .map((item) => item.role ?? 'NULL')
            .join(', ')}`,
        );
      }
    }

    const existingTables = (await context.showAllTables()).map((table) =>
      table.toLowerCase(),
    );
    const presentRbacTables = RBAC_TABLES.filter((table) =>
      existingTables.includes(table),
    );
    if (presentRbacTables.length === 0) {
      await createSchema(context, transaction);
    } else if (presentRbacTables.length !== RBAC_TABLES.length) {
      const missing = RBAC_TABLES.filter(
        (table) => !presentRbacTables.includes(table),
      );
      throw new Error(
        `Database has a partial RBAC schema. Missing tables: ${missing.join(', ')}`,
      );
    }

    await addIndexIfMissing(
      context,
      'user_roles',
      ['roleId'],
      'user_roles_roleId_idx',
      transaction,
    );
    await addIndexIfMissing(
      context,
      'user_roles',
      ['userId', 'roleId'],
      'user_roles_user_role_unique',
      transaction,
      true,
    );
    await addIndexIfMissing(
      context,
      'role_permissions',
      ['permissionId'],
      'role_permissions_permissionId_idx',
      transaction,
    );
    await addIndexIfMissing(
      context,
      'role_permissions',
      ['roleId', 'permissionId'],
      'role_permissions_role_permission_unique',
      transaction,
      true,
    );

    const now = new Date();
    for (const code of PERMISSION_CODES) {
      await context.sequelize.query(
        `INSERT INTO "permissions"
           ("code", "name", "description", "createdAt", "updatedAt")
         VALUES (:code, :name, :description, :createdAt, :updatedAt)
         ON CONFLICT ("code") DO UPDATE SET
           "name" = EXCLUDED."name",
           "description" = EXCLUDED."description",
           "updatedAt" = EXCLUDED."updatedAt"`,
        {
          replacements: {
            code,
            name: permissionLabels[code],
            description: permissionLabels[code],
            createdAt: now,
            updatedAt: now,
          },
          transaction,
        },
      );
    }
    for (const [code, roleName] of [
      ['user', 'User'],
      ['author', 'Author'],
      ['admin', 'Administrator'],
    ] as const) {
      await context.sequelize.query(
        `INSERT INTO "roles"
           ("code", "name", "description", "isSystem", "createdAt", "updatedAt")
         VALUES (:code, :name, :description, true, :createdAt, :updatedAt)
         ON CONFLICT ("code") DO UPDATE SET
           "name" = EXCLUDED."name",
           "description" = EXCLUDED."description",
           "isSystem" = true,
           "updatedAt" = EXCLUDED."updatedAt"`,
        {
          replacements: {
            code,
            name: roleName,
            description: `System role: ${code}`,
            createdAt: now,
            updatedAt: now,
          },
          transaction,
        },
      );
    }

    const roles = await context.sequelize.query<{ id: number; code: string }>(
      'SELECT "id", "code" FROM "roles"',
      { type: QueryTypes.SELECT, transaction },
    );
    const permissions = await context.sequelize.query<{
      id: number;
      code: string;
    }>('SELECT "id", "code" FROM "permissions"', {
      type: QueryTypes.SELECT,
      transaction,
    });
    const roleIds = new Map(roles.map((role) => [role.code, role.id]));
    const permissionIds = new Map(
      permissions.map((permission) => [permission.code, permission.id]),
    );
    const rolePermissions = Object.entries(SYSTEM_ROLE_PERMISSIONS).flatMap(
      ([roleCode, codes]) =>
        codes.map((permissionCode) => ({
          roleId: roleIds.get(roleCode),
          permissionId: permissionIds.get(permissionCode),
        })),
    );
    if (rolePermissions.some((item) => !item.roleId || !item.permissionId)) {
      throw new Error('RBAC system definitions could not be resolved');
    }
    for (const rolePermission of rolePermissions) {
      await context.sequelize.query(
        `INSERT INTO "role_permissions" ("roleId", "permissionId")
         VALUES (:roleId, :permissionId)
         ON CONFLICT ("roleId", "permissionId") DO NOTHING`,
        { replacements: rolePermission, transaction },
      );
    }

    await context.sequelize.query(
      `INSERT INTO "user_roles" ("userId", "roleId")
       SELECT "id", :userRoleId FROM "users"
       ON CONFLICT ("userId", "roleId") DO NOTHING`,
      { replacements: { userRoleId: roleIds.get('user') }, transaction },
    );
    if (hasLegacyRole) {
      await context.sequelize.query(
        `INSERT INTO "user_roles" ("userId", "roleId")
         SELECT "id", CASE
           WHEN "role" = 'author' THEN :authorRoleId
           WHEN "role" = 'admin' THEN :adminRoleId
         END
         FROM "users" WHERE "role" IN ('author', 'admin')
         ON CONFLICT ("userId", "roleId") DO NOTHING`,
        {
          replacements: {
            authorRoleId: roleIds.get('author'),
            adminRoleId: roleIds.get('admin'),
          },
          transaction,
        },
      );
      await context.removeColumn('users', 'role', { transaction });
    }
  });
}

export async function down({
  context,
}: MigrationParams<QueryInterface>): Promise<void> {
  await context.sequelize.transaction(async (transaction) => {
    const customRoles = await context.sequelize.query<{ code: string }>(
      `SELECT "code" FROM "roles" WHERE "isSystem" = false
       OR "code" NOT IN ('user', 'author', 'admin')`,
      { type: QueryTypes.SELECT, transaction },
    );
    if (customRoles.length) {
      throw new Error('Cannot rollback RBAC while custom roles exist');
    }
    await context.addColumn(
      'users',
      'role',
      {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'user',
      },
      { transaction },
    );
    await context.sequelize.query(
      `UPDATE "users" AS u SET "role" = CASE
        WHEN EXISTS (
          SELECT 1 FROM "user_roles" ur JOIN "roles" r ON r."id" = ur."roleId"
          WHERE ur."userId" = u."id" AND r."code" = 'admin'
        ) THEN 'admin'
        WHEN EXISTS (
          SELECT 1 FROM "user_roles" ur JOIN "roles" r ON r."id" = ur."roleId"
          WHERE ur."userId" = u."id" AND r."code" = 'author'
        ) THEN 'author'
        ELSE 'user' END`,
      { transaction },
    );
    await context.dropTable('role_permissions', { transaction });
    await context.dropTable('user_roles', { transaction });
    await context.dropTable('permissions', { transaction });
    await context.dropTable('roles', { transaction });
  });
}
