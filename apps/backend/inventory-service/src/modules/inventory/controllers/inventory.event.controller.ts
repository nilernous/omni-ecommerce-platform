import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DomainEvents } from '@omnicommerce/constants';
import { OrderCancelledPayload, OrderCreatedPayload, PaymentCompletedPayload } from '@omnicommerce/events';
import { InventoryService } from '../services/inventory.service';

@Controller()
export class InventoryEventController {
  private readonly logger = new Logger(InventoryEventController.name);

  constructor(private readonly inventoryService: InventoryService) {}

  // INV-BR-13
  @EventPattern(DomainEvents.ORDER_CREATED)
  async handleOrderCreated(@Payload() data: OrderCreatedPayload) {
    const result = await this.inventoryService.reserveForOrder(data.orderId, data.items);
    if (!result) {
      this.logger.warn(`[INV-BR-13] Order ${data.orderId} could not be reserved (insufficient stock)`);
    }
  }

  // INV-BR-14
  @EventPattern(DomainEvents.PAYMENT_COMPLETED)
  async handlePaymentCompleted(@Payload() data: PaymentCompletedPayload) {
    await this.inventoryService.deductOrder(data.orderId);
  }

  // INV-BR-15
  @EventPattern(DomainEvents.ORDER_CANCELLED)
  async handleOrderCancelled(@Payload() data: OrderCancelledPayload) {
    await this.inventoryService.releaseOrder(data.orderId);
  }
}
