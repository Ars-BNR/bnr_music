import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TrackService } from './track.service';

describe('TrackService', () => {
  const repository = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    increment: jest.fn(),
    create: jest.fn(),
  };
  const genreRepository = { count: jest.fn() };
  const trackGenreRepository = { bulkCreate: jest.fn(), destroy: jest.fn() };
  const fileService = { createFile: jest.fn(), deleteFile: jest.fn() };
  const sequelize = {
    transaction: jest.fn(async (callback: (transaction: object) => unknown) =>
      callback({ LOCK: { UPDATE: 'UPDATE' } }),
    ),
    query: jest.fn(),
  };
  const service = new TrackService(
    repository as any,
    genreRepository as any,
    trackGenreRepository as any,
    fileService as any,
    sequelize as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('accepts the first pagination page where offset is zero', async () => {
    repository.findAll.mockResolvedValue([]);
    await expect(service.getAll(10, 0)).resolves.toEqual([]);
    expect(repository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10, offset: 0 }),
    );
  });

  it('increments listens atomically and returns the persisted value', async () => {
    const track = {
      id: 3,
      listens: 11,
      increment: jest.fn(async () => undefined),
      reload: jest.fn(async function (this: { listens: number }) {
        this.listens = 12;
      }),
    };
    repository.findByPk.mockResolvedValue(track);
    sequelize.query.mockResolvedValue([{ id: '1' }]);
    await expect(service.listen(3)).resolves.toEqual({ listens: 12 });
    expect(track.increment).toHaveBeenCalledWith(
      'listens',
      expect.objectContaining({ by: 1 }),
    );
  });

  it('does not count a repeated playback id twice', async () => {
    const track = { id: 3, listens: 12 };
    repository.findByPk.mockResolvedValue(track);
    sequelize.query.mockResolvedValue([]);
    await expect(
      service.recordPlay(3, 'e68fbe5d-11b6-4310-84df-419421ce6247'),
    ).resolves.toEqual({ recorded: false, listens: 12 });
  });

  it('returns 404 instead of a null dereference for a missing track', async () => {
    repository.findByPk.mockResolvedValue(null);
    await expect(service.listen(404)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates genre links transactionally and removes uploaded files after a rollback', async () => {
    fileService.createFile
      .mockReturnValueOnce('image/cover.jpg')
      .mockReturnValueOnce('audio/song.mp3');
    genreRepository.count.mockResolvedValue(1);
    repository.create.mockResolvedValue({ id: 42 });
    trackGenreRepository.bulkCreate.mockRejectedValue(
      new Error('relation write failed'),
    );

    await expect(
      service.create(
        { name: 'Song', authorId: 1, text: '', genreIds: [1] },
        {
          originalname: 'cover.jpg',
          buffer: Buffer.from('cover'),
        } as Express.Multer.File,
        {
          originalname: 'song.mp3',
          buffer: Buffer.from('audio'),
        } as Express.Multer.File,
      ),
    ).rejects.toThrow('relation write failed');

    expect(trackGenreRepository.bulkCreate).toHaveBeenCalledWith(
      [{ trackId: 42, genreId: 1 }],
      expect.any(Object),
    );
    expect(fileService.deleteFile).toHaveBeenCalledWith('image/cover.jpg');
    expect(fileService.deleteFile).toHaveBeenCalledWith('audio/song.mp3');
  });

  it('rejects unknown genre ids before writing a track', async () => {
    fileService.createFile
      .mockReturnValueOnce('image/cover.jpg')
      .mockReturnValueOnce('audio/song.mp3');
    genreRepository.count.mockResolvedValue(0);
    await expect(
      service.create(
        { name: 'Song', authorId: 1, text: '', genreIds: [999] },
        { originalname: 'cover.jpg' } as Express.Multer.File,
        { originalname: 'song.mp3' } as Express.Multer.File,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
