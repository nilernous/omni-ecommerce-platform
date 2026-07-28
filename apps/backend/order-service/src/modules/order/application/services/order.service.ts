import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, OrderStatus } from '@omnicommerce/database';
import { CreateOrderDto } from '@omnicommerce/dto';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async createOrder(userId: string, dto: CreateOrderDto): Promise<any> {
    const orderNumber = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    return this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        totalAmount: 100.0,
        status: OrderStatus.PENDING,
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
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }
}
