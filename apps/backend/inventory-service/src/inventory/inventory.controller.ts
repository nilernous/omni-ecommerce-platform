import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard, RolesGuard, Roles } from '@omnicommerce/auth';
import { UserRole } from '@omnicommerce/constants';

@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get(':variantId')
  async getStock(@Param('variantId') variantId: string): Promise<any> {
    return this.inventoryService.getStock(variantId);
  }

  @Put(':variantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SELLER, UserRole.SUPER_ADMIN)
  async updateStock(
    @Param('variantId') variantId: string,
    @Body('stock') stock: number,
  ): Promise<any> {
    return this.inventoryService.updateStock(variantId, stock);
  }

  @Post(':variantId/reserve')
  @UseGuards(JwtAuthGuard)
  async reserveStock(
    @Param('variantId') variantId: string,
    @Body('quantity') quantity: number,
  ): Promise<any> {
    return this.inventoryService.reserveStock(variantId, quantity);
  }
}
