import { QueryInterface } from 'sequelize';
import { up, verify } from './0007-catalog-search-and-bulk';

type MigrationColumns = Record<string, Record<string, object>>;

const createContext = (
  initialColumns: MigrationColumns = {
    album_tracks: { id: {}, albumId: {}, trackId: {} },
    tracks: { id: {}, authorId: {}, name: {} },
    albums: { id: {}, authorId: {}, name: {} },
  },
) => {
  const columns = structuredClone(initialColumns);
  const transaction = {};
  const query = jest.fn().mockResolvedValue([]);
  const context = {
    sequelize: {
      query,
      transaction: jest
        .fn()
        .mockImplementation(
          async (callback: (activeTransaction: object) => Promise<void>) =>
            callback(transaction),
        ),
    },
    describeTable: jest.fn(async (table: string) => columns[table] ?? {}),
    addColumn: jest.fn(
      async (table: string, column: string, definition: object) => {
        columns[table] ??= {};
        columns[table][column] = definition;
      },
    ),
    changeColumn: jest.fn().mockResolvedValue(undefined),
  };

  return {
    context: context as unknown as QueryInterface,
    query,
  };
};

const runMigration = (context: QueryInterface) =>
  up({ context } as Parameters<typeof up>[0]);

describe('0007 catalog search and bulk migration', () => {
  it('backfills album positions and creates idempotency and trigram indexes', async () => {
    const { context, query } = createContext();

    await runMigration(context);

    expect(query).toHaveBeenCalledWith(
      'CREATE EXTENSION IF NOT EXISTS pg_trgm',
    );
    expect(context.addColumn).toHaveBeenCalledWith(
      'album_tracks',
      'position',
      expect.objectContaining({ allowNull: true }),
      expect.any(Object),
    );
    expect(context.changeColumn).toHaveBeenCalledWith(
      'album_tracks',
      'position',
      expect.objectContaining({ allowNull: false }),
      expect.any(Object),
    );
    expect(context.addColumn).toHaveBeenCalledWith(
      'tracks',
      'creatorRequestId',
      expect.objectContaining({ allowNull: true }),
      expect.any(Object),
    );
    expect(context.addColumn).toHaveBeenCalledWith(
      'albums',
      'creatorRequestId',
      expect.objectContaining({ allowNull: true }),
      expect.any(Object),
    );
    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).includes('ROW_NUMBER() OVER'),
      ),
    ).toBe(true);
    expect(
      query.mock.calls.filter(([sql]) => String(sql).includes('gin_trgm_ops')),
    ).toHaveLength(5);
    expect(
      query.mock.calls.some(([sql]) =>
        String(sql).includes('album_tracks_album_position_unique'),
      ),
    ).toBe(true);
  });

  it('adopts an already hardened schema without adding columns twice', async () => {
    const { context } = createContext({
      album_tracks: {
        id: {},
        albumId: {},
        trackId: {},
        position: {},
      },
      tracks: { id: {}, authorId: {}, name: {}, creatorRequestId: {} },
      albums: { id: {}, authorId: {}, name: {}, creatorRequestId: {} },
    });

    await runMigration(context);

    expect(context.addColumn).not.toHaveBeenCalled();
    expect(context.changeColumn).toHaveBeenCalledWith(
      'album_tracks',
      'position',
      expect.objectContaining({ allowNull: false }),
      expect.any(Object),
    );
  });

  it('reports a clear error when PostgreSQL cannot install pg_trgm', async () => {
    const { context, query } = createContext();
    query.mockRejectedValueOnce(new Error('permission denied'));

    await expect(runMigration(context)).rejects.toThrow(
      'Migration 0007 requires permission to install PostgreSQL extension pg_trgm: permission denied',
    );
    expect(context.sequelize.transaction).not.toHaveBeenCalled();
  });

  it('reports every installed trigram index from verify', async () => {
    const { context, query } = createContext();
    query.mockResolvedValueOnce([
      { indexname: 'tracks_name_trgm_idx' },
      { indexname: 'albums_name_trgm_idx' },
    ]);

    await expect(verify(context)).resolves.toEqual({
      indexes: ['tracks_name_trgm_idx', 'albums_name_trgm_idx'],
    });
  });
});
