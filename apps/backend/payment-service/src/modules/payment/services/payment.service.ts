import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, PaymentStatus } from '@omnicommerce/database';

@Injectable()
export class PaymentService {
  private processedWebhookIds = new Set<string>();
  private refunds = new Map<string, any>();

  constructor(private prisma: PrismaService) {}

  async createPaymentIntent(orderId: string, paymentMethod: string, amount: number): Promise<any> {
    this.assertPositiveAmount(amount);
    return this.prisma.payment.create({
      data: {
        orderId,
        paymentMethod,
        amount,
        status: PaymentStatus.PENDING,
      },
    });
  }

  async processPayment(orderId: string, paymentMethod: string, amount: number): Promise<any> {
    this.assertPositiveAmount(amount);
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

  async getPaymentById(id: string): Promise<any> {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async verifyWebhook(payload: any): Promise<any> {
    const eventId = payload.eventId || payload.id;
    if (!eventId) {
      throw new BadRequestException('Webhook event id is required');
    }
    if (this.processedWebhookIds.has(eventId)) {
      return { duplicate: true, eventId };
    }

    this.processedWebhookIds.add(eventId);

    if (payload.paymentId && payload.status) {
      await this.prisma.payment.update({
        where: { id: payload.paymentId },
        data: { status: payload.status },
      });
    }

    return { duplicate: false, eventId, processed: true };
  }

  async refundPayment(paymentId: string, amount?: number): Promise<any> {
    const payment = await this.getPaymentById(paymentId);
    const refundAmount = amount ?? Number(payment.amount);
    this.assertPositiveAmount(refundAmount);

    if (refundAmount > Number(payment.amount)) {
      throw new BadRequestException('Refund amount cannot exceed payment amount');
    }

    const refund = {
      id: 'REF-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      paymentId,
      amount: refundAmount,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };

    this.refunds.set(refund.id, refund);

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.REFUNDED },
    });

    return refund;
  }

  async markPaymentFailed(paymentId: string, reason?: string): Promise<any> {
    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.FAILED },
    });

    return {
      ...payment,
      failureReason: reason || 'Payment failed',
    };
  }

  private assertPositiveAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }
  }
}
