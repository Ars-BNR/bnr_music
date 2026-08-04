import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CollectionService } from './collection.service';

describe('CollectionService', () => {
  it('does not disclose another user collection', async () => {
    const collectionRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 1, userId: 2 }),
    };
    const service = new CollectionService(
      collectionRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    await expect(
      service.getByUserId(2, {
        sub: 1,
        email: 'user@example.com',
        role: 'user',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('maps favorite albums through associations without SQL literals', async () => {
    const collectionRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 5, userId: 1 }),
    };
    const collectionAlbumRepository = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 9,
          albumId: 3,
        },
      ]),
      count: jest.fn().mockResolvedValue(1),
    };
    const albumRepository = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 3,
          get: () => ({
            id: 3,
            name: 'Purple Archive',
            picture: 'image/purple.jpg',
            listens: 42,
            authorId: 7,
            author: { name: 'Saint Author' },
            featuredAuthors: [],
          }),
        },
      ]),
    };
    const service = new CollectionService(
      collectionRepository as any,
      {} as any,
      collectionAlbumRepository as any,
      {} as any,
      albumRepository as any,
      {} as any,
    );

    await expect(service.getCurrentUserAlbums(1, 20, 0)).resolves.toEqual({
      items: [
        {
          favoriteRelationId: 9,
          id: 3,
          name: 'Purple Archive',
          picture: 'image/purple.jpg',
          listens: 42,
          authorId: 7,
          authorName: 'Saint Author',
          featuredAuthors: [],
        },
      ],
      total: 1,
    });
    expect(collectionAlbumRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: ['id', 'albumId'],
        limit: 20,
        offset: 0,
      }),
    );
    expect(albumRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.arrayContaining([
          expect.objectContaining({ as: 'author' }),
          expect.objectContaining({ as: 'featuredAuthors' }),
        ]),
      }),
    );
  });

  it('maps paginated favorite tracks in relation order with explicit aliases', async () => {
    const collectionRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 5, userId: 1 }),
    };
    const collectionTrackRepository = {
      findAll: jest.fn().mockResolvedValue([
        { id: 11, trackId: 4 },
        { id: 12, trackId: 3 },
      ]),
      count: jest.fn().mockResolvedValue(2),
    };
    const trackRepository = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 3,
          get: () => ({
            id: 3,
            name: 'Second favorite',
            picture: 'image/second.jpg',
            text: '',
            listens: 2,
            audio: 'audio/second.mp3',
            authorId: 8,
            author: { name: 'Second Author' },
            albums: [],
            featuredAuthors: [],
          }),
        },
        {
          id: 4,
          get: () => ({
            id: 4,
            name: 'First favorite',
            picture: 'image/first.jpg',
            text: '',
            listens: 1,
            audio: 'audio/first.mp3',
            authorId: 7,
            author: { name: 'First Author' },
            albums: [{ id: 9 }],
            featuredAuthors: [
              { id: 12, name: 'Featured Author', avatar: null },
            ],
          }),
        },
      ]),
    };
    const service = new CollectionService(
      collectionRepository as any,
      collectionTrackRepository as any,
      {} as any,
      {} as any,
      {} as any,
      trackRepository as any,
    );

    const result = await service.getCurrentUserTracks(1, 20, 0);

    expect(result.total).toBe(2);
    expect(result.items.map((track) => track.id)).toEqual([4, 3]);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        authorName: 'First Author',
        albumId: 9,
        featuredAuthors: [{ id: 12, name: 'Featured Author', avatar: null }],
      }),
    );
    expect(collectionTrackRepository.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20, offset: 0 }),
    );
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

  it('adds and removes the current user favorite track idempotently', async () => {
    const collectionRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 5, userId: 1 }),
    };
    const collectionTrackRepository = {
      findOrCreate: jest.fn().mockResolvedValue([{ id: 10 }, true]),
      destroy: jest.fn().mockResolvedValue(0),
    };
    const trackRepository = {
      findByPk: jest.fn().mockResolvedValue({ id: 4 }),
    };
    const service = new CollectionService(
      collectionRepository as any,
      collectionTrackRepository as any,
      {} as any,
      {} as any,
      {} as any,
      trackRepository as any,
    );

    await expect(service.setCurrentUserTrack(1, 4)).resolves.toEqual({
      isFavorite: true,
    });
    await expect(service.removeCurrentUserTrack(1, 4)).resolves.toEqual({
      isFavorite: false,
    });
    expect(collectionTrackRepository.findOrCreate).toHaveBeenCalledWith({
      where: { collectionId: 5, trackId: 4 },
      defaults: { collectionId: 5, trackId: 4 },
    });
  });

  it('rejects adding a missing track', async () => {
    const service = new CollectionService(
      { findOne: jest.fn().mockResolvedValue({ id: 5, userId: 1 }) } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { findByPk: jest.fn().mockResolvedValue(null) } as any,
    );

    await expect(service.setCurrentUserTrack(1, 999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
