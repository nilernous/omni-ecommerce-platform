import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, OrderStatus } from '@omnicommerce/database';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async createOrder(userId: string, dto: any): Promise<any> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const items = Array.isArray(dto.items) ? dto.items : [];
    const totalAmount = this.calculateTotalAmount(items, dto.totalAmount);
    const orderNumber = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    return this.prisma.order.create({
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

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<any> {
    const order = await this.getOrderById(orderId);
    this.assertValidTransition(order.status, status);

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: true, payments: true, shippings: true },
    });
  }

  async cancelOrder(orderId: string, userId?: string): Promise<any> {
    const order = await this.getOrderById(orderId);
    if (userId && order.userId !== userId) {
      throw new BadRequestException('Order does not belong to user');
    }
    if (![OrderStatus.PENDING, OrderStatus.PAYMENT_PENDING, OrderStatus.PAID].includes(order.status)) {
      throw new BadRequestException('Only pending or unshipped orders can be cancelled');
    }
    return this.updateOrderStatus(orderId, OrderStatus.CANCELLED);
  }

  async markPaymentCompleted(orderId: string): Promise<any> {
    return this.updateOrderStatus(orderId, OrderStatus.PAID);
  }

  async markShipped(orderId: string): Promise<any> {
    return this.updateOrderStatus(orderId, OrderStatus.SHIPPED);
  }

  async markDelivered(orderId: string): Promise<any> {
    return this.updateOrderStatus(orderId, OrderStatus.DELIVERED);
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
