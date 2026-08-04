import { NotFoundException } from '@nestjs/common';
import { GenreService } from './genre.service';

describe('GenreService', () => {
  const genres = { findByPk: jest.fn(), findAll: jest.fn() };
  const tracks = { findAll: jest.fn() };
  const trackGenres = { findAll: jest.fn(), count: jest.fn() };
  const service = new GenreService(
    genres as any,
    tracks as any,
    trackGenres as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns a paginated genre queue with the public track shape', async () => {
    genres.findByPk.mockResolvedValue({ id: 7, name: 'Games' });
    trackGenres.findAll.mockResolvedValue([{ trackId: 3 }]);
    trackGenres.count.mockResolvedValue(1);
    tracks.findAll.mockResolvedValue([
      {
        id: 3,
        get: () => ({
          id: 3,
          name: 'Theme',
          picture: 'image/theme.jpg',
          text: '',
          listens: 15,
          audio: 'audio/theme.mp3',
          authorId: 2,
          author: { name: 'Composer' },
          albums: [{ id: 4 }],
          featuredAuthors: [],
        }),
      },
    ]);

    await expect(
      service.getTracks(7, { count: 20, offset: 0 }),
    ).resolves.toEqual({
      genre: { id: 7, name: 'Games' },
      total: 1,
      tracks: [expect.objectContaining({ authorName: 'Composer', albumId: 4 })],
    });
    expect(trackGenres.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 20,
        offset: 0,
      }),
    );
    expect(tracks.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.arrayContaining([
          expect.objectContaining({ as: 'author' }),
          expect.objectContaining({ as: 'albums' }),
          expect.objectContaining({ as: 'featuredAuthors' }),
        ]),
      }),
    );
  });

  it('keeps a missing genre as a 404', async () => {
    genres.findByPk.mockResolvedValue(null);
    await expect(
      service.getTracks(404, { count: 20, offset: 0 }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(trackGenres.findAll).not.toHaveBeenCalled();
  });
});
