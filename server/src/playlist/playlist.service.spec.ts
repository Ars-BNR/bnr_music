import { Op } from 'sequelize';
import { PlaylistService } from './playlist.service';

describe('PlaylistService', () => {
  it('returns only the current owner playlists with batched numeric track counts', async () => {
    const playlistRepository = {
      findAll: jest.fn().mockResolvedValue([
        { id: 10, name: 'Purple set', userId: 1 },
        { id: 11, name: 'Saint set', userId: 1 },
      ]),
      count: jest.fn().mockResolvedValue(2),
    };
    const playlistTrackRepository = {
      findAll: jest
        .fn()
        .mockResolvedValue([{ playlistId: 10, trackCount: '2' }]),
    };
    const service = new PlaylistService(
      playlistRepository as any,
      {} as any,
      {} as any,
      playlistTrackRepository as any,
      {} as any,
      {} as any,
    );

    await expect(
      service.getMine(
        { sub: 1, email: 'admin@example.test', role: 'admin' },
        20,
        0,
      ),
    ).resolves.toEqual({
      items: [
        { id: 10, name: 'Purple set', userId: 1, trackCount: 2 },
        { id: 11, name: 'Saint set', userId: 1, trackCount: 0 },
      ],
      total: 2,
    });
    expect(playlistRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 1 }, limit: 20, offset: 0 }),
    );
    expect(playlistRepository.count).toHaveBeenCalledWith({
      where: { userId: 1 },
    });
    const countQuery = playlistTrackRepository.findAll.mock.calls[0][0];
    expect(countQuery.where.playlistId[Op.in]).toEqual([10, 11]);
  });

  it('loads playlist relations first and restores track order with explicit aliases', async () => {
    const playlistRepository = {
      findByPk: jest
        .fn()
        .mockResolvedValue({ id: 5, name: 'Order', userId: 1 }),
    };
    const playlistTrackRepository = {
      findAll: jest.fn().mockResolvedValue([{ trackId: 9 }, { trackId: 3 }]),
      count: jest.fn().mockResolvedValue(2),
    };
    const trackRepository = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 3,
          get: () => ({
            id: 3,
            name: 'Second',
            author: { name: 'Author' },
            albums: [],
            featuredAuthors: [],
          }),
        },
        {
          id: 9,
          get: () => ({
            id: 9,
            name: 'First',
            author: { name: 'Author' },
            albums: [],
            featuredAuthors: [],
          }),
        },
      ]),
    };
    const service = new PlaylistService(
      playlistRepository as any,
      {} as any,
      {} as any,
      playlistTrackRepository as any,
      trackRepository as any,
      {} as any,
    );

    const result = await service.getOne(
      5,
      { sub: 1, email: 'owner@example.test', role: 'user' },
      20,
      0,
    );

    expect(result.tracks.map((track) => track.id)).toEqual([9, 3]);
    expect(trackRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.arrayContaining([
          expect.objectContaining({ as: 'author' }),
          expect.objectContaining({ as: 'albums' }),
          expect.objectContaining({ as: 'featuredAuthors' }),
        ]),
      }),
    );
  });
});
