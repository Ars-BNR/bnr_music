import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AnalyticsQueryDto } from './analytics-query.dto';

describe('AnalyticsQueryDto', () => {
  it.each(['7d', '30d', '90d', 'all'])('accepts period %s', async (period) => {
    const dto = plainToInstance(AnalyticsQueryDto, { period, limit: '20' });
    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.limit).toBe(20);
  });

  it('rejects unknown periods and limits outside 1..20', async () => {
    const dto = plainToInstance(AnalyticsQueryDto, {
      period: 'year',
      limit: 21,
    });
    expect(await validate(dto)).toHaveLength(2);
  });
});
