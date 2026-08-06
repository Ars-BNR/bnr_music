import { ConfigService } from '@nestjs/config';
import { SeedService } from './seed.service';

const model = { count: jest.fn(), bulkCreate: jest.fn() };

const createService = (configValues: Record<string, string | undefined>) => {
  const userModel = { findOrCreate: jest.fn() };
  const collectionModel = { findOrCreate: jest.fn() };
  const config = { get: jest.fn((key: string) => configValues[key]) };
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
    { transaction: jest.fn() } as never,
  );

  return { service, userModel, collectionModel };
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
});
