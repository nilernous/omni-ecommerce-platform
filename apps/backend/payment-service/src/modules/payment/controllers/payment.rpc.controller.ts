import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentService } from '../services/payment.service';

@Controller()
export class PaymentRpcController {
  constructor(private readonly paymentService: PaymentService) {}

  @MessagePattern('payment.process')
  async processPayment(@Payload() data: { orderId: string; paymentMethod: string; amount: number }) {
    return this.paymentService.processPayment(data.orderId, data.paymentMethod, data.amount);
  }

  @MessagePattern('payment.get_by_order')
  async getPaymentByOrder(@Payload() data: { orderId: string }) {
    return this.paymentService.getPaymentByOrder(data.orderId);
  }
}
