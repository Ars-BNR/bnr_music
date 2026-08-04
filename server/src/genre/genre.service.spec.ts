import { NotFoundException } from '@nestjs/common';
import { GenreService } from './genre.service';

describe('GenreService', () => {
  const genres = { findByPk: jest.fn(), findAll: jest.fn() };
  const tracks = { findAndCountAll: jest.fn() };
  const service = new GenreService(genres as any, tracks as any);

  beforeEach(() => jest.clearAllMocks());

  it('returns a paginated genre queue with the public track shape', async () => {
    genres.findByPk.mockResolvedValue({ id: 7, name: 'Games' });
    tracks.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [
        {
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
          }),
        },
      ],
    });

    await expect(
      service.getTracks(7, { count: 20, offset: 0 }),
    ).resolves.toEqual({
      genre: { id: 7, name: 'Games' },
      total: 1,
      tracks: [expect.objectContaining({ authorName: 'Composer', albumId: 4 })],
    });
    expect(tracks.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        distinct: true,
        limit: 20,
        offset: 0,
      }),
    );
  });

  it('keeps a missing genre as a 404', async () => {
    genres.findByPk.mockResolvedValue(null);
    await expect(
      service.getTracks(404, { count: 20, offset: 0 }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tracks.findAndCountAll).not.toHaveBeenCalled();
  });
});
