import { BadRequestException, ConflictException } from '@nestjs/common';
import { CreatorService } from './creator.service';

describe('CreatorService', () => {
  const applicationRepository = {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
  };
  const authorRepository = { findOne: jest.fn(), count: jest.fn() };
  const sequelize = {
    transaction: jest.fn(
      (callback: (transaction: { LOCK: { UPDATE: string } }) => unknown) =>
        callback({ LOCK: { UPDATE: 'UPDATE' } }),
    ),
  };
  const fileService = { createFile: jest.fn(), deleteFile: jest.fn() };
  const service = new CreatorService(
    applicationRepository as never,
    authorRepository as never,
    { findByPk: jest.fn() } as never,
    { count: jest.fn() } as never,
    { count: jest.fn() } as never,
    { count: jest.fn() } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    sequelize as never,
    fileService as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns the explicit none state when a user has no author application', async () => {
    authorRepository.findOne.mockResolvedValue(null);
    applicationRepository.findOne.mockResolvedValue(null);
    await expect(service.getMe(14)).resolves.toEqual({ state: 'none' });
  });

  it('rejects a first application without an avatar before writing data', async () => {
    authorRepository.findOne.mockResolvedValue(null);
    applicationRepository.findOne.mockResolvedValue(null);
    await expect(
      service.submitApplication(
        14,
        { stageName: 'Purple Saint', bio: 'Музыкальный архив Третьей улицы' },
        undefined,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('replaces an application avatar only after the transaction commits', async () => {
    const application = {
      avatar: 'old-avatar.webp',
      status: 'rejected',
      update: jest.fn().mockResolvedValue(undefined),
    };
    authorRepository.findOne.mockResolvedValue(null);
    applicationRepository.findOne.mockResolvedValue(application);
    fileService.createFile.mockReturnValue('new-avatar.webp');

    await service.submitApplication(
      14,
      { stageName: 'Purple Saint', bio: 'A sufficiently long creator bio.' },
      {
        mimetype: 'image/webp',
        size: 1024,
      } as Express.Multer.File,
    );

    expect(application.update).toHaveBeenCalledWith(
      expect.objectContaining({ avatar: 'new-avatar.webp', status: 'pending' }),
      expect.any(Object),
    );
    expect(fileService.deleteFile).toHaveBeenCalledWith('old-avatar.webp');
  });

  it('keeps a reviewed application immutable under the transaction lock', async () => {
    applicationRepository.findByPk.mockResolvedValue({
      status: 'approved',
    });

    await expect(
      service.reject(7, 1, 'Already reviewed.'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
