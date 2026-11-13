import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';
import { DomainEvents } from '@omnicommerce/constants';
import { DomainEventPublisher, EventLineItem, InventoryOrderPayload } from '@omnicommerce/events';

@Injectable()
export class InventoryService {
  private reservations = new Map<string, { variantId: string; quantity: number; status: 'RESERVED' | 'CONFIRMED' | 'RELEASED' }>();
  private readonly lowStockThreshold = 5;

  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private prisma: PrismaService,
    private events: DomainEventPublisher,
  ) {}

  /**
   * INV-BR-13: reserve every line of a new order. Reservation ids are `{orderId}:{variantId}`,
   * so a redelivered event does not reserve twice. If any line fails, the lines already
   * reserved for this order are released and nothing is published.
   */
  async reserveForOrder(orderId: string, items: EventLineItem[]): Promise<InventoryOrderPayload | null> {
    const reserved: InventoryOrderPayload['items'] = [];
    try {
      for (const item of items) {
        const reservationId = this.orderReservationId(orderId, item.variantId);
        if (!this.reservations.has(reservationId)) {
          await this.reserveStock(item.variantId, item.quantity, reservationId);
        }
        reserved.push({ variantId: item.variantId, quantity: item.quantity, reservationId });
      }
    } catch (error) {
      this.logger.warn(`Reservation for order ${orderId} failed: ${(error as Error).message}. Rolling back.`);
      for (const line of reserved) {
        await this.releaseReservation(line.reservationId).catch(() => undefined);
      }
      return null;
    }

    const payload = { orderId, items: reserved };
    await this.events.publish(DomainEvents.INVENTORY_RESERVED, payload); // INV-BR-09
    return payload;
  }

  /** INV-BR-15: release every open reservation of a cancelled order. */
  async releaseOrder(orderId: string): Promise<InventoryOrderPayload> {
    const released: InventoryOrderPayload['items'] = [];
    for (const [reservationId, reservation] of this.orderReservations(orderId)) {
      if (reservation.status === 'RESERVED') {
        await this.releaseReservation(reservationId);
        released.push({ variantId: reservation.variantId, quantity: reservation.quantity, reservationId });
      }
    }
    const payload = { orderId, items: released };
    if (released.length > 0) {
      await this.events.publish(DomainEvents.INVENTORY_RELEASED, payload); // INV-BR-10
    }
    return payload;
  }

  /** INV-BR-14: make the reservations of a paid order permanent and check safety stock. */
  async deductOrder(orderId: string): Promise<InventoryOrderPayload> {
    const deducted: InventoryOrderPayload['items'] = [];
    for (const [reservationId, reservation] of this.orderReservations(orderId)) {
      if (reservation.status === 'RESERVED') {
        await this.confirmReservation(reservationId);
        deducted.push({ variantId: reservation.variantId, quantity: reservation.quantity, reservationId });
      }
    }
    const payload = { orderId, items: deducted };
    if (deducted.length > 0) {
      await this.events.publish(DomainEvents.INVENTORY_DEDUCTED, payload); // INV-BR-11
      for (const line of deducted) {
        await this.publishIfLowStock(line.variantId);
      }
    }
    return payload;
  }

  /** INV-BR-12 */
  private async publishIfLowStock(variantId: string): Promise<void> {
    const variant = await this.getStock(variantId);
    if (variant.stock <= this.lowStockThreshold) {
      await this.events.publish(DomainEvents.INVENTORY_LOW_STOCK, {
        variantId: variant.id,
        sku: variant.sku,
        stock: variant.stock,
        threshold: this.lowStockThreshold,
      });
    }
  }

  private orderReservationId(orderId: string, variantId: string): string {
    return `${orderId}:${variantId}`;
  }

  private orderReservations(orderId: string) {
    return [...this.reservations.entries()].filter(([reservationId]) => reservationId.startsWith(`${orderId}:`));
  }

  async getStock(variantId: string): Promise<any> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, sku: true, stock: true, name: true },
    });
    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }
    return variant;
  }

  async checkStock(items: Array<{ variantId: string; quantity: number }>): Promise<any> {
    const results = await Promise.all(
      items.map(async (item) => {
        const stock = await this.getStock(item.variantId);
        return {
          ...stock,
          requestedQuantity: item.quantity,
          available: stock.stock >= item.quantity,
        };
      }),
    );

    return {
      available: results.every((item) => item.available),
      items: results,
    };
  }

  async updateStock(variantId: string, quantity: number): Promise<any> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }
    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: quantity },
    });
  }

  async reserveStock(variantId: string, quantity: number, reservationId = this.createReservationId()): Promise<any> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }
    if (variant.stock < quantity) {
      throw new BadRequestException(`Insufficient stock for SKU ${variant.sku}`);
    }
    const updatedVariant = await this.prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: variant.stock - quantity },
    });

    this.reservations.set(reservationId, { variantId, quantity, status: 'RESERVED' });

    return {
      reservationId,
      variant: updatedVariant,
    };
  }

  async releaseReservation(reservationId: string): Promise<any> {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      throw new NotFoundException('Inventory reservation not found');
    }
    if (reservation.status !== 'RESERVED') {
      return reservation;
    }

    const variant = await this.prisma.productVariant.findUnique({ where: { id: reservation.variantId } });
    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    const updatedVariant = await this.prisma.productVariant.update({
      where: { id: reservation.variantId },
      data: { stock: variant.stock + reservation.quantity },
    });

    const released = { ...reservation, status: 'RELEASED' as const };
    this.reservations.set(reservationId, released);
    return { reservationId, reservation: released, variant: updatedVariant };
  }

  async confirmReservation(reservationId: string): Promise<any> {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      throw new NotFoundException('Inventory reservation not found');
    }
    if (reservation.status !== 'RESERVED') {
      return reservation;
    }

    const confirmed = { ...reservation, status: 'CONFIRMED' as const };
    this.reservations.set(reservationId, confirmed);
    return { reservationId, reservation: confirmed };
  }

  async adjustStock(variantId: string, delta: number): Promise<any> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    const nextStock = variant.stock + delta;
    if (nextStock < 0) {
      throw new BadRequestException('Stock adjustment would make inventory negative');
    }

    return this.updateStock(variantId, nextStock);
  }

  async getLowStockItems(): Promise<any[]> {
    return this.prisma.productVariant.findMany({
      where: {
        stock: {
          lte: this.lowStockThreshold,
        },
      },
      select: { id: true, sku: true, stock: true, name: true },
    });
  }

  private createReservationId(): string {
    return `RSV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}
