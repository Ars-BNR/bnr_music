import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  it('normalizes database counts and returns all six rankings', async () => {
    const sequelize = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ trackingSince: new Date('2026-01-01') }])
        .mockResolvedValue([{ id: 1, name: 'Saint', listens: '7' }]),
    };
    const service = new AnalyticsService(sequelize as any);
    const result = await service.getDashboard({ period: '30d', limit: 10 });
    expect(result.trackingSince).toBe('2026-01-01T00:00:00.000Z');
    expect(result.popularTracksByGenre[0].listens).toBe(7);
    expect(result.popularAlbumTracksByAuthor[0].listens).toBe(7);
    expect(sequelize.query).toHaveBeenCalledTimes(7);
  });

  it('uses aggregate track counters for the all-time view', async () => {
    const sequelize = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ trackingSince: null }])
        .mockResolvedValue([]),
    };
    await new AnalyticsService(sequelize as any).getDashboard({
      period: 'all',
      limit: 5,
    });
    const sql = sequelize.query.mock.calls[1][0] as string;
    expect(sql).toContain('COALESCE(t.listens, 0)');
    expect(sql).not.toContain('pe."playedAt" >= :since');
  });
});
