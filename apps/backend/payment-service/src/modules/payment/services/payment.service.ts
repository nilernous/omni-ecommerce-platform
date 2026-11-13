import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService, PaymentStatus } from '@omnicommerce/database';
import { DomainEvents } from '@omnicommerce/constants';
import { DomainEventPublisher } from '@omnicommerce/events';

@Injectable()
export class PaymentService {
  private processedWebhookIds = new Set<string>();
  private refunds = new Map<string, any>();

  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private events: DomainEventPublisher,
  ) {}

  /** PAY-BR-19: open a PENDING payment record for a new order (idempotent per order). */
  async initializeForOrder(orderId: string, amount: number, paymentMethod = 'CREDIT_CARD'): Promise<any> {
    const existing = await this.prisma.payment.findFirst({ where: { orderId } });
    if (existing) {
      return existing;
    }
    return this.createPaymentIntent(orderId, paymentMethod, amount);
  }

  /** PAY-BR-20: refund captured payments and void pending ones when an order is cancelled. */
  async handleOrderCancelled(orderId: string): Promise<void> {
    const payments = await this.prisma.payment.findMany({ where: { orderId } });
    for (const payment of payments) {
      if (payment.status === PaymentStatus.COMPLETED) {
        await this.refundPayment(payment.id);
      } else if (payment.status === PaymentStatus.PENDING) {
        // Voided silently: publishing payment.failed here would re-cancel an already cancelled order.
        await this.prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.FAILED } });
        this.logger.log(`[PAY-BR-20] Voided pending payment ${payment.id} of cancelled order ${orderId}`);
      }
    }
  }

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
    // Capture the PENDING record opened on order.created (PAY-BR-19) if there is one.
    const pending = await this.prisma.payment.findFirst({ where: { orderId, status: PaymentStatus.PENDING } });
    const payment = pending
      ? await this.prisma.payment.update({
          where: { id: pending.id },
          data: { paymentMethod, amount, transactionId, status: PaymentStatus.COMPLETED },
        })
      : await this.prisma.payment.create({
          data: { orderId, paymentMethod, amount, transactionId, status: PaymentStatus.COMPLETED },
        });
    await this.publishCompleted(payment);
    return payment;
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
      const payment = await this.prisma.payment.update({
        where: { id: payload.paymentId },
        data: { status: payload.status },
      });
      if (payment.status === PaymentStatus.COMPLETED) {
        await this.publishCompleted(payment);
      } else if (payment.status === PaymentStatus.FAILED) {
        await this.events.publish(DomainEvents.PAYMENT_FAILED, {
          paymentId: payment.id,
          orderId: payment.orderId,
          reason: payload.reason || 'Declined by payment gateway',
        }); // PAY-BR-17
      }
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

    await this.events.publish(DomainEvents.PAYMENT_REFUNDED, {
      paymentId,
      orderId: payment.orderId,
      refundId: refund.id,
      amount: refundAmount,
    }); // PAY-BR-18
    return refund;
  }

  async markPaymentFailed(paymentId: string, reason?: string): Promise<any> {
    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.FAILED },
    });

    const failureReason = reason || 'Payment failed';
    await this.events.publish(DomainEvents.PAYMENT_FAILED, { paymentId: payment.id, orderId: payment.orderId, reason: failureReason }); // PAY-BR-17
    return {
      ...payment,
      failureReason,
    };
  }

  /** PAY-BR-16 */
  private async publishCompleted(payment: { id: string; orderId: string; transactionId: string | null; amount: unknown }): Promise<void> {
    await this.events.publish(DomainEvents.PAYMENT_COMPLETED, {
      paymentId: payment.id,
      orderId: payment.orderId,
      transactionId: payment.transactionId ?? '',
      amount: Number(payment.amount),
    });
  }

  private assertPositiveAmount(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }
  }
}
