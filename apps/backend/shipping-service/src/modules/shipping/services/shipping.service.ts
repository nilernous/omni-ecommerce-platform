import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';
import { DomainEvents, ShippingStatus } from '@omnicommerce/constants';
import { DomainEventPublisher, ShipmentPayload } from '@omnicommerce/events';

@Injectable()
export class ShippingService {
  private trackingEvents = new Map<string, any[]>();

  constructor(
    private prisma: PrismaService,
    private events: DomainEventPublisher,
  ) {}

  /** SHIP-BR-18: a paid order gets a PREPARING shipment awaiting merchant fulfillment (idempotent). */
  async prepareForOrder(orderId: string, carrier = 'STANDARD'): Promise<any> {
    const existing = await this.prisma.shipping.findFirst({ where: { orderId } });
    return existing ?? this.createShipment(orderId, carrier);
  }

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
        status: ShippingStatus.PREPARING, // becomes IN_TRANSIT on carrier pickup (shipping.dispatched)
      },
    });
  }

  async getShippingByOrder(orderId: string): Promise<any[]> {
    return this.prisma.shipping.findMany({
      where: { orderId },
    });
  }

  async generateLabel(orderId: string, carrier = 'STANDARD'): Promise<any> {
    const shipment = (await this.prisma.shipping.findFirst({ where: { orderId } })) ?? (await this.createShipment(orderId, carrier));
    const labelUrl = `/shipping-labels/${shipment.id}.pdf`;
    await this.events.publish(DomainEvents.SHIPPING_LABEL_CREATED, { ...this.toPayload(shipment), labelUrl }); // SHIP-BR-15
    return {
      ...shipment,
      labelUrl,
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
    await this.publishStatusChange(shipment.status, updatedShipment);

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

    const updated = await this.prisma.shipping.update({
      where: { id: shipment.id },
      data: { status: ShippingStatus.DELIVERED },
    });
    await this.publishStatusChange(shipment.status, updated);
    return updated;
  }

  /** SHIP-BR-16 (carrier pickup) and SHIP-BR-17 (delivery); published once per transition. */
  private async publishStatusChange(previous: string, shipment: any): Promise<void> {
    if (previous === shipment.status) {
      return;
    }
    if (shipment.status === ShippingStatus.IN_TRANSIT) {
      await this.events.publish(DomainEvents.SHIPPING_DISPATCHED, this.toPayload(shipment));
    } else if (shipment.status === ShippingStatus.DELIVERED) {
      await this.events.publish(DomainEvents.SHIPPING_DELIVERED, this.toPayload(shipment));
    }
  }

  private toPayload(shipment: any): ShipmentPayload {
    return {
      shipmentId: shipment.id,
      orderId: shipment.orderId,
      carrier: shipment.carrier,
      trackingNumber: shipment.trackingNumber,
    };
  }

  async getTrackingEvents(trackingNumber: string): Promise<any[]> {
    return this.trackingEvents.get(trackingNumber) || [];
  }
}
