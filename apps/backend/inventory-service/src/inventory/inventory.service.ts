import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';

@Injectable()
export class InventoryService {
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

  async reserveStock(variantId: string, quantity: number): Promise<any> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }
    if (variant.stock < quantity) {
      throw new BadRequestException(`Insufficient stock for SKU ${variant.sku}`);
    }
    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: variant.stock - quantity },
    });
  }
}
