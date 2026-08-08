import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { SeedService } from './seed.service';
import seedAuthorCredentials from './data/user-seed';

const model = { count: jest.fn(), bulkCreate: jest.fn() };

const createService = (configValues: Record<string, string | undefined>) => {
  const userModel = { findOrCreate: jest.fn() };
  const collectionModel = { findOrCreate: jest.fn() };
  const config = { get: jest.fn((key: string) => configValues[key]) };
  const tokenService = { removeAllForUser: jest.fn() };
  const sequelize = { transaction: jest.fn() };
  const service = new SeedService(
    model as never,
    model as never,
    userModel as never,
    model as never,
    model as never,
    model as never,
    model as never,
    collectionModel as never,
    model as never,
    model as never,
    model as never,
    model as never,
    model as never,
    config as unknown as ConfigService,
    {
      ensureSystemDefinitions: jest.fn(),
      assignSystemRole: jest.fn(),
    } as never,
    tokenService as never,
    sequelize as never,
  );

  return { service, userModel, collectionModel, tokenService, sequelize };
};

describe('SeedService', () => {
  it('stops before any write when seed credentials are missing', async () => {
    const { service, userModel, collectionModel } = createService({
      SEED_ADMIN_EMAIL: 'admin@example.test',
    });

    await expect(service.seed()).rejects.toThrow(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required',
    );
    expect(userModel.findOrCreate).not.toHaveBeenCalled();
    expect(collectionModel.findOrCreate).not.toHaveBeenCalled();
  });

  it('rejects whitespace-only credentials before any write', async () => {
    const { service, userModel } = createService({
      SEED_ADMIN_EMAIL: '   ',
      SEED_ADMIN_PASSWORD: '   ',
    });

    await expect(service.seed()).rejects.toThrow(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required',
    );
    expect(userModel.findOrCreate).not.toHaveBeenCalled();
  });

  it('forbids catalog seed in production before any write', async () => {
    const { service, userModel, sequelize } = createService({
      NODE_ENV: 'production',
      SEED_ADMIN_EMAIL: 'admin@example.test',
      SEED_ADMIN_PASSWORD: 'valid-password',
    });

    await expect(service.seed()).rejects.toThrow(
      'Catalog seed is disabled in production',
    );
    expect(userModel.findOrCreate).not.toHaveBeenCalled();
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('migrates legacy author accounts and remains idempotent', async () => {
    const transaction = { LOCK: { UPDATE: 'UPDATE' } };
    const authors = seedAuthorCredentials.map((credential, index) => ({
      id: index + 1,
      name: credential.authorName,
      userId: index === 0 ? 41 : null,
      update: jest.fn(function (this: { userId: number }, values) {
        Object.assign(this, values);
        return Promise.resolve(this);
      }),
    }));
    const users: Array<Record<string, unknown>> = [
      {
        id: 41,
        email: 'seed-author-1@bnr.local',
        password: await bcrypt.hash('legacy-password', 4),
        sessionVersion: 2,
      },
    ];
    const makeUser = (values: Record<string, unknown>) => {
      const user = {
        ...values,
        id: (values.id as number | undefined) ?? 41 + users.length,
        update: jest.fn(function (this: Record<string, unknown>, updates) {
          Object.assign(this, updates);
          return Promise.resolve(this);
        }),
      };
      return user;
    };
    users[0] = makeUser(users[0]);

    const authorModel = {
      findOne: jest.fn(({ where }: { where: Record<string, unknown> }) => {
        if ('name' in where)
          return Promise.resolve(
            authors.find((author) => author.name === where.name) ?? null,
          );
        return Promise.resolve(
          authors.find((author) => author.userId === where.userId) ?? null,
        );
      }),
    };
    const userModel = {
      findOne: jest.fn(({ where }: { where: { email: string } }) =>
        Promise.resolve(
          users.find((user) => user.email === where.email) ?? null,
        ),
      ),
      findByPk: jest.fn((id: number) =>
        Promise.resolve(users.find((user) => user.id === id) ?? null),
      ),
      create: jest.fn((values: Record<string, unknown>) => {
        const user = makeUser(values);
        users.push(user);
        return Promise.resolve(user);
      }),
    };
    const collectionModel = { findOrCreate: jest.fn() };
    const rbacService = { assignSystemRole: jest.fn() };
    const tokenService = { removeAllForUser: jest.fn() };
    const sequelize = {
      transaction: jest.fn((callback: (value: unknown) => unknown) =>
        callback(transaction),
      ),
    };
    const service = new SeedService(
      model as never,
      model as never,
      userModel as never,
      authorModel as never,
      model as never,
      model as never,
      model as never,
      collectionModel as never,
      model as never,
      model as never,
      model as never,
      model as never,
      model as never,
      { get: jest.fn() } as unknown as ConfigService,
      rbacService as never,
      tokenService as never,
      sequelize as never,
    );
    const table = jest.spyOn(console, 'table').mockImplementation();

    await service['ensureSeedAuthorAccounts']();

    expect(users).toHaveLength(4);
    expect(users.map((user) => user.email)).toEqual(
      seedAuthorCredentials.map((credential) => credential.email),
    );
    expect(authors.map((author) => author.userId)).toEqual([41, 42, 43, 44]);
    expect(users[0].sessionVersion).toBe(3);
    expect(tokenService.removeAllForUser).toHaveBeenCalledTimes(1);
    expect(rbacService.assignSystemRole).toHaveBeenCalledTimes(8);
    expect(collectionModel.findOrCreate).toHaveBeenCalledTimes(4);

    await service['ensureSeedAuthorAccounts']();

    expect(users).toHaveLength(4);
    expect(userModel.create).toHaveBeenCalledTimes(3);
    expect(tokenService.removeAllForUser).toHaveBeenCalledTimes(1);
    expect(table).toHaveBeenCalledTimes(2);
    table.mockRestore();
  });
});
