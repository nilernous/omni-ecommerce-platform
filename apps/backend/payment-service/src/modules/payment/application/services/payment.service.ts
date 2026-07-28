import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, PaymentStatus } from '@omnicommerce/database';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async processPayment(orderId: string, paymentMethod: string, amount: number): Promise<any> {
    const transactionId = 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    return this.prisma.payment.create({
      data: {
        orderId,
        paymentMethod,
        amount,
        transactionId,
        status: PaymentStatus.COMPLETED,
      },
    });
  }

  async getPaymentByOrder(orderId: string): Promise<any[]> {
    return this.prisma.payment.findMany({
      where: { orderId },
    });
  }
}
