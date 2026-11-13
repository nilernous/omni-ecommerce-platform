import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { DomainEvents } from '@omnicommerce/constants';
import { OrderStatusPayload } from '@omnicommerce/events';
import { ShippingService } from '../services/shipping.service';

@Controller()
export class ShippingEventController {
  constructor(private readonly shippingService: ShippingService) {}

  // SHIP-BR-18: prepare the paid order for merchant fulfillment.
  @EventPattern(DomainEvents.ORDER_PAID)
  async handleOrderPaid(@Payload() data: OrderStatusPayload) {
    await this.shippingService.prepareForOrder(data.orderId);
  }
}
