import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ANALYTICS_SERVICE } from '../../../common/constants/services.constant';

@Injectable()
export class AnalyticsService {
  constructor(@Inject(ANALYTICS_SERVICE) private readonly analyticsClient: ClientProxy) {}

  getGmv(startDate?: string, endDate?: string) {
    return this.analyticsClient.send({ cmd: 'analytics.getGmv' }, { startDate, endDate });
  }

  getNetRevenue(startDate?: string, endDate?: string) {
    return this.analyticsClient.send({ cmd: 'analytics.getNetRevenue' }, { startDate, endDate });
  }

  getConversionRate() {
    return this.analyticsClient.send({ cmd: 'analytics.getConversionRate' }, {});
  }

  getDashboardSummary() {
    return this.analyticsClient.send({ cmd: 'analytics.getDashboardSummary' }, {});
  }
}
