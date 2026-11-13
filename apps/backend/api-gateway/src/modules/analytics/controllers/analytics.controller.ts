import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/constants/roles.constant';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SELLER)
  @Get('gmv')
  @ApiOperation({ summary: 'Get Gross Merchandise Value (GMV)' })
  getGmv(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.analyticsService.getGmv(startDate, endDate);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SELLER)
  @Get('revenue')
  @ApiOperation({ summary: 'Get Net Revenue & Financial Metrics' })
  getNetRevenue(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.analyticsService.getNetRevenue(startDate, endDate);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('conversion')
  @ApiOperation({ summary: 'Get Storefront Conversion Rate & Funnel Metrics' })
  getConversionRate() {
    return this.analyticsService.getConversionRate();
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('summary')
  @ApiOperation({ summary: 'Get Unified Analytics Dashboard Summary' })
  getDashboardSummary() {
    return this.analyticsService.getDashboardSummary();
  }
}
