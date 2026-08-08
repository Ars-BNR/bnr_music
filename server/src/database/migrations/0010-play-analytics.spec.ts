import { down, up } from './0010-play-analytics';

describe('0010-play-analytics migration', () => {
  const transaction = {};
  const context = {
    showAllTables: jest.fn(),
    createTable: jest.fn(),
    dropTable: jest.fn(),
    sequelize: {
      transaction: jest.fn(async (callback: (value: object) => unknown) =>
        callback(transaction),
      ),
      query: jest.fn(),
    },
  };

  beforeEach(() => jest.clearAllMocks());

  it('creates the event schema, indexes and grants analytics to admin', async () => {
    context.showAllTables.mockResolvedValue([]);
    await up({ context: context as any, name: '0010-play-analytics' });
    expect(context.createTable).toHaveBeenCalledWith(
      'play_events',
      expect.objectContaining({
        playbackId: expect.objectContaining({ unique: true }),
        trackId: expect.objectContaining({
          references: { model: 'tracks', key: 'id' },
        }),
      }),
      { transaction },
    );
    const sql = context.sequelize.query.mock.calls
      .map(([statement]) => statement)
      .join('\n');
    expect(sql).toContain('play_events_played_track_idx');
    expect(sql).toContain("'analytics.read'");
    expect(sql).toContain("r.code = 'admin'");
  });

  it('is safe when the event table already exists', async () => {
    context.showAllTables.mockResolvedValue(['play_events']);
    await up({ context: context as any, name: '0010-play-analytics' });
    expect(context.createTable).not.toHaveBeenCalled();
    expect(context.sequelize.query).toHaveBeenCalled();
  });

  it('removes only analytics additions on rollback', async () => {
    context.showAllTables.mockResolvedValue(['play_events']);
    await down({ context: context as any, name: '0010-play-analytics' });
    expect(context.dropTable).toHaveBeenCalledWith('play_events', {
      transaction,
    });
  });
});
