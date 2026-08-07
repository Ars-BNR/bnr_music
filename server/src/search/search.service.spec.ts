import 'reflect-metadata';
import { SearchType } from './dto/search-query.dto';
import { SearchService } from './search.service';

const model = <T extends object>(value: T) => ({
  get: jest.fn().mockReturnValue(value),
});

describe('SearchService', () => {
  const tracks = { findAll: jest.fn() };
  const authors = { findAll: jest.fn() };
  const albums = { findAll: jest.fn() };
  const genres = { findAll: jest.fn() };
  const playlists = { findAll: jest.fn() };
  const playlistTracks = { findAll: jest.fn() };
  const sequelize = { query: jest.fn() };
  const service = new SearchService(
    tracks as never,
    authors as never,
    albums as never,
    genres as never,
    playlists as never,
    playlistTracks as never,
    sequelize as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('restores ranked track order and maps every album and featured author', async () => {
    sequelize.query.mockResolvedValue([
      { id: 9, total: '2' },
      { id: 3, total: '2' },
    ]);
    tracks.findAll.mockResolvedValue([
      model({
        id: 3,
        name: 'Substring result',
        author: { id: 1, name: 'Primary' },
        albums: [
          { id: 12, name: 'Second album', AlbumTrackModel: { position: 1 } },
          { id: 11, name: 'First album', AlbumTrackModel: { position: 0 } },
        ],
        featuredAuthors: [
          {
            id: 8,
            name: 'Featured',
            avatar: null,
            TrackFeaturedAuthorModel: { position: 0 },
          },
        ],
      }),
      model({
        id: 9,
        name: 'Exact result',
        author: { id: 2, name: 'Exact artist' },
        albums: [],
        featuredAuthors: [],
      }),
    ]);

    const result = await service.searchType(
      SearchType.Tracks,
      'exact result',
      20,
      0,
    );

    expect(result.total).toBe(2);
    expect(result.items.map((track) => track.id)).toEqual([9, 3]);
    expect(result.items[1]).toEqual(
      expect.objectContaining({
        authorName: 'Primary',
        albumId: 11,
        albums: [
          { id: 11, name: 'First album' },
          { id: 12, name: 'Second album' },
        ],
        featuredAuthors: [expect.objectContaining({ id: 8, name: 'Featured' })],
      }),
    );
    expect(tracks.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.arrayContaining([
          expect.objectContaining({ as: 'author' }),
          expect.objectContaining({ as: 'featuredAuthors' }),
          expect.objectContaining({ as: 'albums' }),
        ]),
      }),
    );
    const [sql, options] = sequelize.query.mock.calls[0];
    expect(sql).toEqual(expect.stringContaining('COUNT(*) OVER()'));
    expect(sql).toEqual(expect.stringContaining('match_similarity DESC'));
    expect(options.replacements).toEqual(
      expect.objectContaining({
        query: 'exact result',
        prefix: 'exact result%',
        contains: '%exact result%',
        count: 20,
        offset: 0,
      }),
    );
  });

  it('keeps the total when the requested page is empty', async () => {
    sequelize.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ total: '27' }]);

    await expect(
      service.searchType(SearchType.Genres, 'music', 20, 40),
    ).resolves.toEqual({ items: [], total: 27 });
    expect(genres.findAll).not.toHaveBeenCalled();
  });

  it('maps public playlist owner names and batched numeric track counts', async () => {
    sequelize.query.mockResolvedValue([{ id: 4, total: 1 }]);
    playlists.findAll.mockResolvedValue([
      model({
        id: 4,
        name: 'Purple archive',
        user: { displayName: 'Keeper', email: 'keeper@example.test' },
      }),
    ]);
    playlistTracks.findAll.mockResolvedValue([
      { playlistId: 4, trackCount: '3' },
    ]);

    await expect(
      service.searchType(SearchType.Playlists, 'purple', 5, 0),
    ).resolves.toEqual({
      items: [
        {
          id: 4,
          name: 'Purple archive',
          ownerName: 'Keeper',
          trackCount: 3,
        },
      ],
      total: 1,
    });
    expect(playlists.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: [expect.objectContaining({ as: 'user' })],
      }),
    );
    expect(playlistTracks.findAll).toHaveBeenCalledTimes(1);
  });

  it('returns five preview groups with independent totals', async () => {
    const searchType = jest
      .spyOn(service, 'searchType')
      .mockImplementation(async (type) => ({
        items: [{ id: Object.values(SearchType).indexOf(type) + 1 }],
        total: Object.values(SearchType).indexOf(type) + 10,
      }));

    const result = await service.preview('saints', 5);

    expect(Object.keys(result)).toEqual(Object.values(SearchType));
    expect(result.tracks).toEqual({ items: [{ id: 1 }], total: 10 });
    expect(result.playlists).toEqual({ items: [{ id: 5 }], total: 14 });
    expect(searchType).toHaveBeenCalledTimes(5);
    expect(searchType).toHaveBeenCalledWith(SearchType.Albums, 'saints', 5, 0);
  });
});
