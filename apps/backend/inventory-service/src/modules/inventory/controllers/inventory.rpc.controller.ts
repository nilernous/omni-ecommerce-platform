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

  @MessagePattern('inventory.update_stock')
  async updateStock(@Payload() data: { variantId: string; stock: number }) {
    return this.inventoryService.updateStock(data.variantId, data.stock);
  }

  @MessagePattern('inventory.reserve_stock')
  async reserveStock(@Payload() data: { variantId: string; quantity: number }) {
    return this.inventoryService.reserveStock(data.variantId, data.quantity);
  }
}
