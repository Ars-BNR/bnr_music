import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreatorService } from './creator.service';
import * as bcrypt from 'bcrypt';

describe('CreatorService', () => {
  const applicationRepository = {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
  };
  const authorRepository = { findOne: jest.fn(), count: jest.fn() };
  const userRepository = { findByPk: jest.fn() };
  const trackRepository = {
    create: jest.fn(),
    count: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn(),
  };
  const albumRepository = {
    create: jest.fn(),
    count: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    destroy: jest.fn(),
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
    userRepository as never,
    trackRepository as never,
    albumRepository as never,
    genreRepository as never,
    trackGenreRepository as never,
    albumTrackRepository as never,
    trackFeaturedAuthorRepository as never,
    albumFeaturedAuthorRepository as never,
    sequelize as never,
    fileService as never,
    { assignSystemRole: jest.fn(), removeSystemRole: jest.fn() } as never,
    { removeAllForUser: jest.fn() } as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    fileService.deleteFile.mockImplementation(() => undefined);
  });

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

  it('keeps a rejected application immutable under the transaction lock', async () => {
    applicationRepository.findByPk.mockResolvedValue({
      status: 'rejected',
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

  it('atomically deletes owned tracks and cleans files after commit', async () => {
    authorRepository.findOne.mockResolvedValue({ id: 7 });
    trackRepository.findAll.mockResolvedValue([
      { id: 12, picture: 'image/12.webp', audio: 'audio/12.mp3' },
      { id: 14, picture: 'image/14.webp', audio: 'audio/14.mp3' },
    ]);
    trackRepository.destroy.mockResolvedValue(2);

    await expect(service.deleteTracks(14, [14, 12])).resolves.toEqual({
      deletedIds: [14, 12],
    });
    expect(trackRepository.destroy).toHaveBeenCalledWith(
      expect.objectContaining({ transaction: expect.any(Object) }),
    );
    expect(fileService.deleteFile).toHaveBeenCalledWith('image/14.webp');
    expect(fileService.deleteFile).toHaveBeenCalledWith('audio/12.mp3');
  });

  it('rejects a bulk track deletion if any release is absent or foreign', async () => {
    authorRepository.findOne.mockResolvedValue({ id: 7 });
    trackRepository.findAll.mockResolvedValue([
      { id: 12, picture: 'image/12.webp', audio: 'audio/12.mp3' },
    ]);

    await expect(service.deleteTracks(14, [12, 999])).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(trackRepository.destroy).not.toHaveBeenCalled();
    expect(fileService.deleteFile).not.toHaveBeenCalled();
  });

  it('deletes albums without deleting their tracks', async () => {
    authorRepository.findOne.mockResolvedValue({ id: 7 });
    albumRepository.findAll.mockResolvedValue([
      { id: 31, picture: 'image/album-31.webp' },
    ]);
    albumRepository.destroy.mockResolvedValue(1);

    await expect(service.deleteAlbums(14, [31])).resolves.toEqual({
      deletedIds: [31],
    });
    expect(albumRepository.destroy).toHaveBeenCalledTimes(1);
    expect(trackRepository.destroy).not.toHaveBeenCalled();
    expect(fileService.deleteFile).toHaveBeenCalledWith('image/album-31.webp');
  });

  it('does not turn a committed deletion into an error when cleanup fails', async () => {
    authorRepository.findOne.mockResolvedValue({ id: 7 });
    albumRepository.findAll.mockResolvedValue([
      { id: 31, picture: 'image/missing.webp' },
    ]);
    albumRepository.destroy.mockResolvedValue(1);
    fileService.deleteFile.mockImplementation(() => {
      throw new Error('missing file');
    });

    await expect(service.deleteAlbums(14, [31])).resolves.toEqual({
      deletedIds: [31],
    });
  });

  it('updates the public author and approved application together', async () => {
    const author = {
      id: 7,
      userId: 14,
      name: 'Old Saint',
      bio: 'Old biography long enough.',
      avatar: 'image/old-avatar.webp',
      update: jest.fn().mockImplementation(async function (values) {
        Object.assign(this, values);
      }),
    };
    const application = {
      status: 'approved',
      avatar: 'image/old-avatar.webp',
      update: jest.fn().mockResolvedValue(undefined),
    };
    authorRepository.findOne.mockResolvedValue(author);
    applicationRepository.findOne.mockResolvedValue(application);
    trackRepository.count.mockResolvedValue(2);
    albumRepository.count.mockResolvedValue(1);
    fileService.createFile.mockReturnValue('image/new-avatar.webp');

    await service.updateProfile(
      14,
      { stageName: 'New Saint', bio: 'A new sufficiently long biography.' },
      { mimetype: 'image/webp', size: 1024 } as Express.Multer.File,
    );

    expect(author.update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Saint',
        bio: 'A new sufficiently long biography.',
        avatar: 'image/new-avatar.webp',
      }),
      expect.any(Object),
    );
    expect(application.update).toHaveBeenCalledWith(
      expect.objectContaining({ stageName: 'New Saint' }),
      expect.any(Object),
    );
    expect(fileService.deleteFile).toHaveBeenCalledTimes(1);
    expect(fileService.deleteFile).toHaveBeenCalledWith(
      'image/old-avatar.webp',
    );
  });

  it('deletes the author catalog while preserving the user account', async () => {
    const password = await bcrypt.hash('author-password', 4);
    const application = {
      avatar: 'image/author.webp',
      destroy: jest.fn().mockResolvedValue(undefined),
    };
    const author = {
      id: 7,
      userId: 14,
      name: 'Purple Saint',
      avatar: 'image/author.webp',
      destroy: jest.fn().mockResolvedValue(undefined),
    };
    userRepository.findByPk.mockResolvedValue({ id: 14, password });
    authorRepository.findOne.mockResolvedValue(author);
    applicationRepository.findOne.mockResolvedValue(application);
    trackRepository.findAll.mockResolvedValue([
      { id: 41, picture: 'image/track.webp', audio: 'audio/track.mp3' },
    ]);
    albumRepository.findAll.mockResolvedValue([
      { id: 31, picture: 'image/album.webp' },
    ]);
    trackRepository.destroy.mockResolvedValue(1);
    albumRepository.destroy.mockResolvedValue(1);

    await expect(
      service.deleteProfile(14, {
        currentPassword: 'author-password',
        stageName: 'Purple Saint',
      }),
    ).resolves.toEqual({ deleted: true, authorId: 7 });

    expect(application.destroy).toHaveBeenCalled();
    expect(author.destroy).toHaveBeenCalled();
    expect(userRepository.findByPk).toHaveBeenCalledTimes(1);
    expect(fileService.deleteFile).toHaveBeenCalledWith('audio/track.mp3');
  });

  it('does not delete anything when the current password is invalid', async () => {
    userRepository.findByPk.mockResolvedValue({
      id: 14,
      password: await bcrypt.hash('correct-password', 4),
    });

    await expect(
      service.deleteProfile(14, {
        currentPassword: 'wrong-password',
        stageName: 'Purple Saint',
      }),
    ).rejects.toThrow('Current password is incorrect');
    expect(authorRepository.findOne).not.toHaveBeenCalled();
    expect(trackRepository.destroy).not.toHaveBeenCalled();
  });
});
