import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InventoryService } from '../services/inventory.service';

@Controller()
export class InventoryEventController {
  constructor(private readonly inventoryService: InventoryService) {}

  @EventPattern('order.created')
  async handleOrderCreated(@Payload() data: { items: Array<{ variantId: string; quantity: number }> }) {
    if (data?.items) {
      for (const item of data.items) {
        await this.inventoryService.reserveStock(item.variantId, item.quantity);
      }
    }
  }
}
