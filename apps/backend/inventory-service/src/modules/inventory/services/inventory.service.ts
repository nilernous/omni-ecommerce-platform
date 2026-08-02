import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';

@Injectable()
export class InventoryService {
  private reservations = new Map<string, { variantId: string; quantity: number; status: 'RESERVED' | 'CONFIRMED' | 'RELEASED' }>();
  private readonly lowStockThreshold = 5;

  constructor(private prisma: PrismaService) {}

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
