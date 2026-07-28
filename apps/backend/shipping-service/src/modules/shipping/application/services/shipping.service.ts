import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';

@Injectable()
export class ShippingService {
  constructor(private prisma: PrismaService) {}

  async createShipment(orderId: string, carrier: string): Promise<any> {
    const trackingNumber = 'TRK-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    return this.prisma.shipping.create({
      data: {
        orderId,
        carrier,
        trackingNumber,
        shippingCost: 15.0,
        status: 'IN_TRANSIT',
      },
    });
  }

  async getShippingByOrder(orderId: string): Promise<any[]> {
    return this.prisma.shipping.findMany({
      where: { orderId },
    });
  }
}
