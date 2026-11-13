import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DomainEvents } from '@omnicommerce/constants';
import { OrderStatusPayload } from '@omnicommerce/events';
import { ReviewService } from '../services/review.service';

@Controller()
export class ReviewEventController {
  private readonly logger = new Logger(ReviewEventController.name);

  constructor(private readonly reviewService: ReviewService) {}

  // REV-BR-12: delivered orders grant verified-purchase review eligibility.
  @EventPattern(DomainEvents.ORDER_DELIVERED)
  async handleOrderDelivered(@Payload() data: OrderStatusPayload) {
    const productIds = await this.reviewService.recordDeliveredOrder(
      data.userId,
      data.items.map((item) => item.variantId),
    );
    this.logger.log(`[REV-BR-12] Order ${data.orderId}: user ${data.userId} can review ${productIds.length} product(s)`);
  }
}
