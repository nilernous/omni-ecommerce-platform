import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ShippingService } from '../services/shipping.service';

@Controller()
export class ShippingEventController {
  constructor(private readonly shippingService: ShippingService) {}

  @EventPattern('payment.succeeded')
  async handlePaymentSucceeded(@Payload() data: { orderId: string }) {
    if (data?.orderId) {
      await this.shippingService.createShipment(data.orderId, 'STANDARD_EXPRESS');
    }
  }
}
