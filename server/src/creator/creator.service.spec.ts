import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreatorService } from './creator.service';

describe('CreatorService', () => {
  const applicationRepository = {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
  };
  const authorRepository = { findOne: jest.fn(), count: jest.fn() };
  const trackRepository = {
    create: jest.fn(),
    count: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };
  const albumRepository = {
    create: jest.fn(),
    count: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
  };
  const genreRepository = { count: jest.fn() };
  const trackGenreRepository = { bulkCreate: jest.fn() };
  const albumTrackRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    max: jest.fn(),
    bulkCreate: jest.fn(),
  };
  const trackFeaturedAuthorRepository = { bulkCreate: jest.fn() };
  const albumFeaturedAuthorRepository = { bulkCreate: jest.fn() };
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
    trackRepository as never,
    albumRepository as never,
    genreRepository as never,
    trackGenreRepository as never,
    albumTrackRepository as never,
    trackFeaturedAuthorRepository as never,
    albumFeaturedAuthorRepository as never,
    sequelize as never,
    fileService as never,
    { assignSystemRole: jest.fn() } as never,
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

  it('creates an album with ordered featured-author relations', async () => {
    authorRepository.findOne.mockResolvedValue({ id: 7 });
    authorRepository.count.mockResolvedValue(2);
    fileService.createFile.mockReturnValue('image/creator-album.webp');
    albumRepository.create.mockResolvedValue({ id: 31 });

    await service.createAlbum(
      14,
      { name: 'Purple Archive', featuredAuthorIds: [12, 13] },
      { mimetype: 'image/webp', size: 1024 } as Express.Multer.File,
    );

    expect(albumFeaturedAuthorRepository.bulkCreate).toHaveBeenCalledWith(
      [
        { albumId: 31, authorId: 12, position: 0 },
        { albumId: 31, authorId: 13, position: 1 },
      ],
      expect.objectContaining({ transaction: expect.any(Object) }),
    );
  });

  it('creates a track with ordered featured-author relations', async () => {
    authorRepository.findOne.mockResolvedValue({ id: 7 });
    authorRepository.count.mockResolvedValue(2);
    genreRepository.count.mockResolvedValue(1);
    fileService.createFile
      .mockReturnValueOnce('image/creator-track.webp')
      .mockReturnValueOnce('audio/creator-track.mp3');
    trackRepository.create.mockResolvedValue({ id: 41 });

    await service.createTrack(
      14,
      {
        name: 'Saints Theme',
        genreIds: [3],
        featuredAuthorIds: [12, 13],
      },
      { mimetype: 'image/webp', size: 1024 } as Express.Multer.File,
      { mimetype: 'audio/mpeg', size: 2048 } as Express.Multer.File,
    );

    expect(trackFeaturedAuthorRepository.bulkCreate).toHaveBeenCalledWith(
      [
        { trackId: 41, authorId: 12, position: 0 },
        { trackId: 41, authorId: 13, position: 1 },
      ],
      expect.objectContaining({ transaction: expect.any(Object) }),
    );
  });

  it('returns an idempotent album before storing another uploaded cover', async () => {
    const existing = { id: 31, name: 'Already published' };
    authorRepository.findOne.mockResolvedValue({ id: 7 });
    albumRepository.findOne.mockResolvedValue(existing);

    await expect(
      service.createAlbum(
        14,
        { name: 'Retry', featuredAuthorIds: [] },
        { mimetype: 'image/webp', size: 1024 } as Express.Multer.File,
        '11111111-1111-4111-8111-111111111111',
      ),
    ).resolves.toBe(existing);

    expect(fileService.createFile).not.toHaveBeenCalled();
    expect(albumRepository.create).not.toHaveBeenCalled();
  });

  it('adds only missing owned tracks and preserves their requested order', async () => {
    authorRepository.findOne.mockResolvedValue({ id: 7 });
    albumRepository.findByPk.mockResolvedValue({ id: 31, authorId: 7 });
    trackRepository.findAll.mockResolvedValue([
      { id: 12, authorId: 7 },
      { id: 13, authorId: 7 },
      { id: 14, authorId: 7 },
    ]);
    albumTrackRepository.findAll.mockResolvedValue([{ trackId: 13 }]);
    albumTrackRepository.max.mockResolvedValue(4);

    await expect(
      service.assignAlbumTracks(14, 31, [13, 12, 14]),
    ).resolves.toEqual({
      albumId: 31,
      addedTrackIds: [12, 14],
      trackIds: [13, 12, 14],
    });
    expect(albumTrackRepository.bulkCreate).toHaveBeenCalledWith(
      [
        { albumId: 31, trackId: 12, position: 5 },
        { albumId: 31, trackId: 14, position: 6 },
      ],
      expect.objectContaining({ transaction: expect.any(Object) }),
    );
  });

  it('rejects self-featuring and removes the newly stored cover', async () => {
    authorRepository.findOne.mockResolvedValue({ id: 7 });
    fileService.createFile.mockReturnValue('image/rejected-album.webp');

    await expect(
      service.createAlbum(
        14,
        { name: 'Invalid album', featuredAuthorIds: [7] },
        { mimetype: 'image/webp', size: 1024 } as Express.Multer.File,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(albumRepository.create).not.toHaveBeenCalled();
    expect(fileService.deleteFile).toHaveBeenCalledWith(
      'image/rejected-album.webp',
    );
  });

  it('rejects an unknown featured author before creating an album', async () => {
    authorRepository.findOne.mockResolvedValue({ id: 7 });
    authorRepository.count.mockResolvedValue(1);
    fileService.createFile.mockReturnValue('image/unknown-feat.webp');

    await expect(
      service.createAlbum(
        14,
        { name: 'Unknown feat', featuredAuthorIds: [12, 999] },
        { mimetype: 'image/webp', size: 1024 } as Express.Multer.File,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(albumRepository.create).not.toHaveBeenCalled();
    expect(fileService.deleteFile).toHaveBeenCalledWith(
      'image/unknown-feat.webp',
    );
  });
});
