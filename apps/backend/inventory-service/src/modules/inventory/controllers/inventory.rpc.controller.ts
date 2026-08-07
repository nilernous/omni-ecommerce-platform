import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InventoryService } from '../services/inventory.service';

@Controller()
export class InventoryRpcController {
  constructor(private readonly inventoryService: InventoryService) {}

  @MessagePattern('inventory.get_stock')
  async getStock(@Payload() data: { variantId: string }) {
    return this.inventoryService.getStock(data.variantId);
  }

  @MessagePattern('inventory.check_stock')
  async checkStock(@Payload() data: { items?: Array<{ variantId: string; quantity: number }>; variantId?: string; quantity?: number }) {
    const items = data.items || [{ variantId: data.variantId || '', quantity: data.quantity || 1 }];
    return this.inventoryService.checkStock(items);
  }

  @MessagePattern('inventory.update_stock')
  async updateStock(@Payload() data: { variantId: string; stock: number }) {
    return this.inventoryService.updateStock(data.variantId, data.stock);
  }

  @MessagePattern('inventory.reserve_stock')
  @MessagePattern('inventory.reserve')
  async reserveStock(@Payload() data: { variantId: string; quantity: number; reservationId?: string }) {
    return this.inventoryService.reserveStock(data.variantId, data.quantity, data.reservationId);
  }

  @MessagePattern('inventory.release')
  async releaseReservation(@Payload() data: { reservationId: string }) {
    return this.inventoryService.releaseReservation(data.reservationId);
  }

  @MessagePattern('inventory.confirm')
  async confirmReservation(@Payload() data: { reservationId: string }) {
    return this.inventoryService.confirmReservation(data.reservationId);
  }

  @MessagePattern('inventory.adjust_stock')
  async adjustStock(@Payload() data: { variantId: string; delta: number }) {
    return this.inventoryService.adjustStock(data.variantId, data.delta);
  }

  @MessagePattern('inventory.low_stock')
  async getLowStockItems() {
    return this.inventoryService.getLowStockItems();
  }
}
