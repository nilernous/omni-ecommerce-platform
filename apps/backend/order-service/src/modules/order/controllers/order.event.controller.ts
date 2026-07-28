import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { OrderService } from '../services/order.service';

@Controller()
export class OrderEventController {
  constructor(private readonly orderService: OrderService) {}

  @EventPattern('payment.succeeded')
  async handlePaymentSucceeded(@Payload() data: { orderId: string }) {
    if (data?.orderId) {
      await this.orderService.updateOrderStatus(data.orderId, 'PROCESSING' as any);
    }
  }
}
