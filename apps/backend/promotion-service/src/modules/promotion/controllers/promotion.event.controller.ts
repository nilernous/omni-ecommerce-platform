import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DomainEvents } from '@omnicommerce/constants';
import { OrderCancelledPayload, OrderCreatedPayload } from '@omnicommerce/events';
import { PromotionService } from '../services/promotion.service';

@Controller()
export class PromotionEventController {
  constructor(private readonly promotionService: PromotionService) {}

  // PROM-BR-13
  @EventPattern(DomainEvents.ORDER_CREATED)
  async handleOrderCreated(@Payload() data: OrderCreatedPayload) {
    if (data.couponCode) {
      await this.promotionService.redeemForOrder(data.orderId, data.userId, data.couponCode, data.totalAmount);
    }
  }

  // PROM-BR-14
  @EventPattern(DomainEvents.ORDER_CANCELLED)
  async handleOrderCancelled(@Payload() data: OrderCancelledPayload) {
    await this.promotionService.revertForOrder(data.orderId);
  }
}
