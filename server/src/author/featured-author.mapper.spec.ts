import { mapFeaturedAuthors } from './featured-author.mapper';

describe('mapFeaturedAuthors', () => {
  it('preserves the explicit album credit order', () => {
    const authors = [
      {
        id: 2,
        name: 'First by id',
        avatar: null,
        AlbumFeaturedAuthorModel: { position: 1 },
      },
      {
        id: 3,
        name: 'First by credit',
        avatar: 'image/featured.webp',
        AlbumFeaturedAuthorModel: { position: 0 },
      },
    ];

    expect(mapFeaturedAuthors(authors as never)).toEqual([
      { id: 3, name: 'First by credit', avatar: 'image/featured.webp' },
      { id: 2, name: 'First by id', avatar: null },
    ]);
  });

  it('preserves the explicit track credit order', () => {
    const authors = [
      {
        id: 7,
        name: 'Second credit',
        avatar: null,
        TrackFeaturedAuthorModel: { position: 1 },
      },
      {
        id: 8,
        name: 'First credit',
        avatar: null,
        TrackFeaturedAuthorModel: { position: 0 },
      },
    ];

    expect(mapFeaturedAuthors(authors as never).map(({ id }) => id)).toEqual([
      8, 7,
    ]);
  });
});
