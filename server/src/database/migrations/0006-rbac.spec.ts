import { QueryInterface } from 'sequelize';
import { up } from './0006-rbac';

const roleRows = [
  { id: 1, code: 'user' },
  { id: 2, code: 'author' },
  { id: 3, code: 'admin' },
];

const permissionCodes = [
  'profile.manage-own',
  'library.manage-own',
  'creator.apply',
  'creator.publish',
  'creator.moderate',
  'catalog.manage',
  'users.read',
  'rbac.manage',
];

type ContextOptions = {
  hasLegacyRole?: boolean;
  tables?: string[];
  invalidRoles?: Array<{ role: string | null }>;
};

const createContext = (options: ContextOptions = {}) => {
  const transaction = {};
  const query = jest.fn(async (sql: string) => {
    if (sql.includes('SELECT DISTINCT "role"')) {
      return options.invalidRoles ?? [];
    }
    if (sql.includes('SELECT "id", "code" FROM "roles"')) return roleRows;
    if (sql.includes('SELECT "id", "code" FROM "permissions"')) {
      return permissionCodes.map((code, index) => ({ id: index + 10, code }));
    }
    return [];
  });
  const context = {
    sequelize: {
      transaction: jest
        .fn()
        .mockImplementation(
          async (callback: (activeTransaction: object) => Promise<void>) =>
            callback(transaction),
        ),
      query,
    },
    describeTable: jest
      .fn()
      .mockResolvedValue(
        options.hasLegacyRole
          ? { id: {}, email: {}, role: {} }
          : { id: {}, email: {} },
      ),
    showAllTables: jest.fn().mockResolvedValue(options.tables ?? []),
    showIndex: jest.fn().mockResolvedValue([]),
    createTable: jest.fn().mockResolvedValue(undefined),
    addIndex: jest.fn().mockResolvedValue(undefined),
    removeColumn: jest.fn().mockResolvedValue(undefined),
  };
  return { context: context as unknown as QueryInterface, query };
};

const runMigration = (context: QueryInterface) =>
  up({ context } as Parameters<typeof up>[0]);

describe('0006-rbac migration', () => {
  it('adopts a clean current schema whose RBAC tables were materialized by Sequelize', async () => {
    const { context, query } = createContext({
      tables: ['roles', 'permissions', 'user_roles', 'role_permissions'],
    });

    await runMigration(context);

    expect(context.createTable).not.toHaveBeenCalled();
    expect(context.removeColumn).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "user_roles" ("userId", "roleId")'),
      expect.objectContaining({ replacements: { userRoleId: 1 } }),
    );
    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).includes('WHEN "role" = \'author\''),
      ),
    ).toBe(false);
  });

  it('creates RBAC tables and migrates valid legacy user, author and admin roles', async () => {
    const { context, query } = createContext({ hasLegacyRole: true });

    await runMigration(context);

    expect(context.createTable).toHaveBeenCalledTimes(4);
    expect(context.createTable).toHaveBeenNthCalledWith(
      1,
      'roles',
      expect.any(Object),
      expect.any(Object),
    );
    expect(context.removeColumn).toHaveBeenCalledWith(
      'users',
      'role',
      expect.any(Object),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('WHEN "role" = \'author\' THEN :authorRoleId'),
      expect.objectContaining({
        replacements: { authorRoleId: 2, adminRoleId: 3 },
      }),
    );
  });

  it('rejects an unknown legacy role before creating or mutating the RBAC schema', async () => {
    const { context } = createContext({
      hasLegacyRole: true,
      invalidRoles: [{ role: 'super-admin' }],
    });

    await expect(runMigration(context)).rejects.toThrow(
      'Unknown legacy user roles: super-admin',
    );
    expect(context.showAllTables).not.toHaveBeenCalled();
    expect(context.createTable).not.toHaveBeenCalled();
    expect(context.removeColumn).not.toHaveBeenCalled();
  });

  it('rejects a partial RBAC schema and lists every missing table', async () => {
    const { context } = createContext({
      tables: ['roles', 'permissions'],
    });

    await expect(runMigration(context)).rejects.toThrow(
      'Database has a partial RBAC schema. Missing tables: user_roles, role_permissions',
    );
    expect(context.createTable).not.toHaveBeenCalled();
    expect(context.removeColumn).not.toHaveBeenCalled();
  });
});
