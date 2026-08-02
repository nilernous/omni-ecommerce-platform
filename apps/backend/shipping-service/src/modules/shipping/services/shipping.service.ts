import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';

@Injectable()
export class ShippingService {
  private trackingEvents = new Map<string, any[]>();

  constructor(private prisma: PrismaService) {}

  async calculateRates(data: any): Promise<any[]> {
    const weight = Number(data.weight || 1);
    const subtotal = Number(data.subtotal || 0);
    const baseRate = subtotal >= 100 ? 0 : 8;

    return [
      {
        carrier: 'STANDARD',
        serviceLevel: 'GROUND',
        amount: Number((baseRate + weight * 0.75).toFixed(2)),
        estimatedDays: 5,
      },
      {
        carrier: 'EXPRESS',
        serviceLevel: 'EXPRESS',
        amount: Number((18 + weight * 1.25).toFixed(2)),
        estimatedDays: 2,
      },
    ];
  }

  async createShipment(orderId: string, carrier: string): Promise<any> {
    if (!orderId) {
      throw new BadRequestException('orderId is required');
    }
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

  async generateLabel(orderId: string, carrier = 'STANDARD'): Promise<any> {
    const shipment = await this.createShipment(orderId, carrier);
    return {
      ...shipment,
      labelUrl: `/shipping-labels/${shipment.id}.pdf`,
      labelFormat: 'PDF',
    };
  }

  async ingestTrackingUpdate(trackingNumber: string, status: string, payload: any = {}): Promise<any> {
    const shipment = await this.prisma.shipping.findFirst({ where: { trackingNumber } });
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    const updatedShipment = await this.prisma.shipping.update({
      where: { id: shipment.id },
      data: { status },
    });

    const event = {
      trackingNumber,
      status,
      payload,
      occurredAt: new Date().toISOString(),
    };
    const events = this.trackingEvents.get(trackingNumber) || [];
    events.push(event);
    this.trackingEvents.set(trackingNumber, events);

    return { shipment: updatedShipment, event };
  }

  async confirmDelivery(orderId: string): Promise<any> {
    const shipment = await this.prisma.shipping.findFirst({ where: { orderId } });
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    return this.prisma.shipping.update({
      where: { id: shipment.id },
      data: { status: 'DELIVERED' },
    });
  }

  async getTrackingEvents(trackingNumber: string): Promise<any[]> {
    return this.trackingEvents.get(trackingNumber) || [];
  }
}
