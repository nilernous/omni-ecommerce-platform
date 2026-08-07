import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentService } from '../services/payment.service';

@Controller()
export class PaymentRpcController {
  constructor(private readonly paymentService: PaymentService) {}

  @MessagePattern('payment.create_intent')
  async createPaymentIntent(@Payload() data: { orderId: string; paymentMethod: string; amount: number }) {
    return this.paymentService.createPaymentIntent(data.orderId, data.paymentMethod, data.amount);
  }

  @MessagePattern('payment.process')
  async processPayment(@Payload() data: { orderId: string; paymentMethod?: string; amount: number }) {
    return this.paymentService.processPayment(data.orderId, data.paymentMethod || 'CREDIT_CARD', data.amount);
  }

  @MessagePattern('payment.get_by_order')
  async getPaymentByOrder(@Payload() data: { orderId: string }) {
    return this.paymentService.getPaymentByOrder(data.orderId);
  }

  @MessagePattern('payment.get_by_id')
  async getPaymentById(@Payload() data: { id?: string; paymentId?: string }) {
    return this.paymentService.getPaymentById(data.id || data.paymentId || '');
  }

  @MessagePattern('payment.webhook')
  async verifyWebhook(@Payload() data: any) {
    return this.paymentService.verifyWebhook(data);
  }

  @MessagePattern('payment.refund')
  async refundPayment(@Payload() data: { paymentId?: string; id?: string; amount?: number }) {
    return this.paymentService.refundPayment(data.paymentId || data.id || '', data.amount);
  }

  @MessagePattern('payment.failed')
  async markPaymentFailed(@Payload() data: { paymentId?: string; id?: string; reason?: string }) {
    return this.paymentService.markPaymentFailed(data.paymentId || data.id || '', data.reason);
  }
}
