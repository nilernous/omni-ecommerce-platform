import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService, OrderStatus } from '@omnicommerce/database';
import { DomainEvents } from '@omnicommerce/constants';
import { DomainEventPublisher, OrderStatusPayload } from '@omnicommerce/events';

/** Status changes that are announced as domain events (ORD-BR-16 .. ORD-BR-19). */
const STATUS_EVENTS: Partial<Record<OrderStatus, DomainEvents.ORDER_PAID | DomainEvents.ORDER_SHIPPED | DomainEvents.ORDER_DELIVERED | DomainEvents.ORDER_CANCELLED>> = {
  [OrderStatus.PAID]: DomainEvents.ORDER_PAID,
  [OrderStatus.SHIPPED]: DomainEvents.ORDER_SHIPPED,
  [OrderStatus.DELIVERED]: DomainEvents.ORDER_DELIVERED,
  [OrderStatus.CANCELLED]: DomainEvents.ORDER_CANCELLED,
};

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma: PrismaService,
    private events: DomainEventPublisher,
  ) {}

  async createOrder(userId: string, dto: any): Promise<any> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const items = Array.isArray(dto.items) ? dto.items : [];
    const totalAmount = this.calculateTotalAmount(items, dto.totalAmount);
    const orderNumber = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        totalAmount,
        status: OrderStatus.PAYMENT_PENDING,
        items: {
          create: items.map((item: any) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice || item.price || 0,
            totalPrice: (item.unitPrice || item.price || 0) * item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // ORD-BR-15: triggers inventory reservation, payment initialization, coupon redemption, notifications.
    await this.events.publish(DomainEvents.ORDER_CREATED, {
      ...this.toStatusPayload(order),
      paymentMethod: dto.paymentMethod,
      couponCode: dto.couponCode,
    });
    return order;
  }

  async getUserOrders(userId: string): Promise<any[]> {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true, payments: true, shippings: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(orderId: string): Promise<any> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true, shippings: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, reason?: string): Promise<any> {
    const order = await this.getOrderById(orderId);
    if (order.status === status) {
      return order; // idempotent: no duplicate event
    }
    this.assertValidTransition(order.status, status);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: true, payments: true, shippings: true },
    });

    const eventType = STATUS_EVENTS[status];
    if (eventType === DomainEvents.ORDER_CANCELLED) {
      await this.events.publish(eventType, { ...this.toStatusPayload(updated), reason });
    } else if (eventType) {
      await this.events.publish(eventType, this.toStatusPayload(updated));
    }
    return updated;
  }

  async cancelOrder(orderId: string, userId?: string, reason = 'Cancelled by customer'): Promise<any> {
    const order = await this.getOrderById(orderId);
    if (userId && order.userId !== userId) {
      throw new BadRequestException('Order does not belong to user');
    }
    if (![OrderStatus.PENDING, OrderStatus.PAYMENT_PENDING, OrderStatus.PAID].includes(order.status)) {
      throw new BadRequestException('Only pending or unshipped orders can be cancelled');
    }
    return this.updateOrderStatus(orderId, OrderStatus.CANCELLED, reason);
  }

  async markPaymentCompleted(orderId: string): Promise<any> {
    return this.updateOrderStatus(orderId, OrderStatus.PAID);
  }

  async markShipped(orderId: string): Promise<any> {
    const order = await this.getOrderById(orderId);
    if (order.status === OrderStatus.PAID) {
      await this.updateOrderStatus(orderId, OrderStatus.PROCESSING); // ORD-BR-10: fulfillment started
    }
    return this.updateOrderStatus(orderId, OrderStatus.SHIPPED);
  }

  async markDelivered(orderId: string): Promise<any> {
    return this.updateOrderStatus(orderId, OrderStatus.DELIVERED);
  }

  /**
   * Applies a status change triggered by another service's event. Orders that are not in one of
   * `expected` statuses are skipped (logged) instead of failing, so the message is not retried forever.
   */
  async applyExternalTransition(orderId: string, expected: OrderStatus[], apply: () => Promise<unknown>, source: string): Promise<void> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      this.logger.warn(`${source}: order ${orderId} not found, skipping`);
      return;
    }
    if (!expected.includes(order.status)) {
      this.logger.warn(`${source}: order ${orderId} is ${order.status}, expected ${expected.join('/')}; skipping`);
      return;
    }
    await apply();
  }

  private toStatusPayload(order: any): OrderStatusPayload {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      totalAmount: Number(order.totalAmount),
      items: (order.items ?? []).map((item: any) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })),
    };
  }

  private calculateTotalAmount(items: any[], explicitTotal?: number): number {
    if (typeof explicitTotal === 'number') {
      return explicitTotal;
    }

    return items.reduce((total, item) => total + (item.unitPrice || item.price || 0) * (item.quantity || 0), 0);
  }

  private assertValidTransition(current: OrderStatus, next: OrderStatus): void {
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PAYMENT_PENDING, OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAYMENT_PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    if (current === next) {
      return;
    }

    if (!allowedTransitions[current].includes(next)) {
      throw new BadRequestException(`Invalid order status transition from ${current} to ${next}`);
    }
  }
}
