import { NotFoundException } from '@nestjs/common';
import { TrackService } from './track.service';

describe('TrackService', () => {
  const repository = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    increment: jest.fn(),
  };
  const fileService = { createFile: jest.fn(), deleteFile: jest.fn() };
  const service = new TrackService(repository as any, fileService as any);

  beforeEach(() => jest.clearAllMocks());

  it('accepts the first pagination page where offset is zero', async () => {
    repository.findAll.mockResolvedValue([]);
    await expect(service.getAll(10, 0)).resolves.toEqual([]);
    expect(repository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10, offset: 0 }),
    );
  });

  it('increments listens atomically and returns the persisted value', async () => {
    repository.increment.mockResolvedValue([1]);
    repository.findByPk.mockResolvedValue({ id: 3, listens: 12 });
    await expect(service.listen(3)).resolves.toEqual({ listens: 12 });
    expect(repository.increment).toHaveBeenCalledWith('listens', {
      where: { id: 3 },
    });
  });

  it('returns 404 instead of a null dereference for a missing track', async () => {
    repository.increment.mockResolvedValue([0]);
    await expect(service.listen(404)).rejects.toBeInstanceOf(NotFoundException);
  });
});
