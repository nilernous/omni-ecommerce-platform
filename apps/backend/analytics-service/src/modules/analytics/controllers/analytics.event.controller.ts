import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DomainEvents } from '@omnicommerce/constants';
import { AnalyticsService } from '../services/analytics.service';

@Controller()
export class AnalyticsEventController {
  private readonly logger = new Logger(AnalyticsEventController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @EventPattern(DomainEvents.ORDER_CREATED)
  async handleOrderCreated(@Payload() data: any) {
    this.logger.log(`[ANL-BR-09] Ingesting order.created event for analytics`);
    await this.analyticsService.ingestMetric({
      eventType: 'order.created',
      sourceService: 'order-service',
      payload: data,
    });
  }

  @EventPattern(DomainEvents.ORDER_PAID)
  async handleOrderPaid(@Payload() data: any) {
    this.logger.log(`[ANL-BR-10] Ingesting order.paid event for analytics`);
    await this.analyticsService.ingestMetric({
      eventType: 'order.paid',
      sourceService: 'order-service',
      payload: data,
    });
  }

  @EventPattern(DomainEvents.ORDER_CANCELLED)
  async handleOrderCancelled(@Payload() data: any) {
    this.logger.log(`[ANL-BR-11] Ingesting order.cancelled event for analytics`);
    await this.analyticsService.ingestMetric({
      eventType: 'order.cancelled',
      sourceService: 'order-service',
      payload: data,
    });
  }

  // ANL-BR-12 names `user.registered`; the producer key is `auth.user.registered` (AUTH-BR-16).
  @EventPattern(DomainEvents.AUTH_USER_REGISTERED)
  async handleUserRegistered(@Payload() data: any) {
    this.logger.log(`[ANL-BR-12] Ingesting auth.user.registered event for analytics`);
    await this.analyticsService.ingestMetric({
      eventType: 'auth.user.registered',
      sourceService: 'identity-service',
      payload: data,
    });
  }

  @EventPattern(DomainEvents.PRODUCT_CREATED)
  async handleProductCreated(@Payload() data: any) {
    this.logger.log(`[ANL-BR-13] Ingesting product.created event for analytics`);
    await this.analyticsService.ingestMetric({
      eventType: 'product.created',
      sourceService: 'product-service',
      payload: data,
    });
  }
}
