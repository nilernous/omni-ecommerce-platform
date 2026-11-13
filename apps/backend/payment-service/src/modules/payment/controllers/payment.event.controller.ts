import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DomainEvents } from '@omnicommerce/constants';
import { OrderCancelledPayload, OrderCreatedPayload } from '@omnicommerce/events';
import { PaymentService } from '../services/payment.service';

@Controller()
export class PaymentEventController {
  constructor(private readonly paymentService: PaymentService) {}

  // PAY-BR-19: initialize a PENDING payment record. Capture happens via payment.process / webhook.
  @EventPattern(DomainEvents.ORDER_CREATED)
  async handleOrderCreated(@Payload() data: OrderCreatedPayload) {
    if (data.totalAmount > 0) {
      await this.paymentService.initializeForOrder(data.orderId, data.totalAmount, data.paymentMethod);
    }
  }

  // PAY-BR-20
  @EventPattern(DomainEvents.ORDER_CANCELLED)
  async handleOrderCancelled(@Payload() data: OrderCancelledPayload) {
    await this.paymentService.handleOrderCancelled(data.orderId);
  }
}
