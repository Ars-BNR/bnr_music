import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Permissions } from 'src/rbac/permissions.decorator';
import { PermissionsGuard } from 'src/rbac/permissions.guard';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('analytics.read')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  getDashboard(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getDashboard(query);
  }
}
