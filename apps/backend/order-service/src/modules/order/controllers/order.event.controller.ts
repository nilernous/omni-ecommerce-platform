import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { OrderStatus } from '@omnicommerce/database';
import { DomainEvents } from '@omnicommerce/constants';
import { PaymentCompletedPayload, PaymentFailedPayload, ShipmentPayload } from '@omnicommerce/events';
import { OrderService } from '../services/order.service';

@Controller()
export class OrderEventController {
  constructor(private readonly orderService: OrderService) {}

  // ORD-BR-20: PENDING_PAYMENT -> PAID
  @EventPattern(DomainEvents.PAYMENT_COMPLETED)
  async handlePaymentCompleted(@Payload() data: PaymentCompletedPayload) {
    await this.orderService.applyExternalTransition(
      data.orderId,
      [OrderStatus.PENDING, OrderStatus.PAYMENT_PENDING],
      () => this.orderService.markPaymentCompleted(data.orderId),
      'ORD-BR-20',
    );
  }

  // ORD-BR-21: PENDING_PAYMENT -> CANCELLED
  @EventPattern(DomainEvents.PAYMENT_FAILED)
  async handlePaymentFailed(@Payload() data: PaymentFailedPayload) {
    await this.orderService.applyExternalTransition(
      data.orderId,
      [OrderStatus.PENDING, OrderStatus.PAYMENT_PENDING],
      () => this.orderService.updateOrderStatus(data.orderId, OrderStatus.CANCELLED, `Payment failed: ${data.reason}`),
      'ORD-BR-21',
    );
  }

  // ORD-BR-22: PAID/PROCESSING -> SHIPPED
  @EventPattern(DomainEvents.SHIPPING_DISPATCHED)
  async handleShippingDispatched(@Payload() data: ShipmentPayload) {
    await this.orderService.applyExternalTransition(
      data.orderId,
      [OrderStatus.PAID, OrderStatus.PROCESSING],
      () => this.orderService.markShipped(data.orderId),
      'ORD-BR-22',
    );
  }

  // SHIP-BR-17 (no ORD-BR consumer rule yet): SHIPPED -> DELIVERED
  @EventPattern(DomainEvents.SHIPPING_DELIVERED)
  async handleShippingDelivered(@Payload() data: ShipmentPayload) {
    await this.orderService.applyExternalTransition(
      data.orderId,
      [OrderStatus.SHIPPED],
      () => this.orderService.markDelivered(data.orderId),
      'SHIP-BR-17',
    );
  }
}
