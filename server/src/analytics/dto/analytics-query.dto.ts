import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const ANALYTICS_PERIODS = ['7d', '30d', '90d', 'all'] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export class AnalyticsQueryDto {
  @IsOptional()
  @IsIn(ANALYTICS_PERIODS)
  period: AnalyticsPeriod = '30d';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit = 10;
}
