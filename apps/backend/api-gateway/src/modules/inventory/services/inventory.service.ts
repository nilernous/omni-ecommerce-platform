import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { INVENTORY_SERVICE } from '../../../common/constants/services.constant';
import { PATTERNS } from '../../../common/constants/patterns.constant';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class InventoryService {
  constructor(@Inject(INVENTORY_SERVICE) private readonly inventoryClient: ClientProxy) {}

  checkStock(sku: string) {
    return lastValueFrom(this.inventoryClient.send(PATTERNS.INVENTORY.CHECK_STOCK, { sku }));
  }

  updateStock(sku: string, quantity: number) {
    return lastValueFrom(this.inventoryClient.send(PATTERNS.INVENTORY.UPDATE_STOCK, { sku, quantity }));
  }
}
