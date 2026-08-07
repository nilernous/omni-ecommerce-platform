import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AnalyticsService } from '../services/analytics.service';

@Controller()
export class AnalyticsEventController {
  private readonly logger = new Logger(AnalyticsEventController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @EventPattern('order.created')
  async handleOrderCreated(@Payload() data: any) {
    this.logger.log(`[ANL-BR-09] Ingesting order.created event for analytics`);
    await this.analyticsService.ingestMetric({
      eventType: 'order.created',
      sourceService: 'order-service',
      payload: data,
    });
  }

  @EventPattern('order.paid')
  async handleOrderPaid(@Payload() data: any) {
    this.logger.log(`[ANL-BR-10] Ingesting order.paid event for analytics`);
    await this.analyticsService.ingestMetric({
      eventType: 'order.paid',
      sourceService: 'order-service',
      payload: data,
    });
  }

  @EventPattern('order.cancelled')
  async handleOrderCancelled(@Payload() data: any) {
    this.logger.log(`[ANL-BR-11] Ingesting order.cancelled event for analytics`);
    await this.analyticsService.ingestMetric({
      eventType: 'order.cancelled',
      sourceService: 'order-service',
      payload: data,
    });
  }

  @EventPattern('user.registered')
  async handleUserRegistered(@Payload() data: any) {
    this.logger.log(`[ANL-BR-12] Ingesting user.registered event for analytics`);
    await this.analyticsService.ingestMetric({
      eventType: 'user.registered',
      sourceService: 'user-service',
      payload: data,
    });
  }

  @EventPattern('product.created')
  async handleProductCreated(@Payload() data: any) {
    this.logger.log(`[ANL-BR-13] Ingesting product.created event for analytics`);
    await this.analyticsService.ingestMetric({
      eventType: 'product.created',
      sourceService: 'product-service',
      payload: data,
    });
  }
}
