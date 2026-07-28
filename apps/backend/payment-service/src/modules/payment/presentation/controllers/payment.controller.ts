import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentService } from '../../application/services/payment.service';
import { JwtAuthGuard } from '@omnicommerce/auth';

@Controller()
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('process')
  async processPayment(
    @Body('orderId') orderId: string,
    @Body('paymentMethod') paymentMethod: string,
    @Body('amount') amount: number,
  ): Promise<any> {
    return this.paymentService.processPayment(orderId, paymentMethod, amount);
  }

  @Get('order/:orderId')
  async getPaymentByOrder(@Param('orderId') orderId: string): Promise<any[]> {
    return this.paymentService.getPaymentByOrder(orderId);
  }
}
