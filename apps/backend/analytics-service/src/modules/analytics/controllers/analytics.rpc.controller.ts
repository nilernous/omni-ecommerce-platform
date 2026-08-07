import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AnalyticsService, TelemetryMetricDto } from '../services/analytics.service';

@Controller()
export class AnalyticsRpcController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @MessagePattern({ cmd: 'analytics.ingest' })
  async ingestMetric(@Payload() data: TelemetryMetricDto) {
    return this.analyticsService.ingestMetric(data);
  }

  @MessagePattern({ cmd: 'analytics.getGmv' })
  async getGmv(@Payload() data: { startDate?: string; endDate?: string }) {
    return this.analyticsService.getGmv(data?.startDate, data?.endDate);
  }

  @MessagePattern({ cmd: 'analytics.getNetRevenue' })
  async getNetRevenue(@Payload() data: { startDate?: string; endDate?: string }) {
    return this.analyticsService.getNetRevenue(data?.startDate, data?.endDate);
  }

  @MessagePattern({ cmd: 'analytics.getConversionRate' })
  async getConversionRate() {
    return this.analyticsService.getConversionRate();
  }

  @MessagePattern({ cmd: 'analytics.getDashboardSummary' })
  async getDashboardSummary() {
    return this.analyticsService.getDashboardSummary();
  }
}
