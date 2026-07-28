import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PaymentService } from '../services/payment.service';

@Controller()
export class PaymentEventController {
  constructor(private readonly paymentService: PaymentService) {}

  @EventPattern('order.created')
  async handleOrderCreated(@Payload() data: { orderId: string; amount: number }) {
    if (data?.orderId && data?.amount) {
      await this.paymentService.processPayment(data.orderId, 'CREDIT_CARD', data.amount);
    }
  }
}
