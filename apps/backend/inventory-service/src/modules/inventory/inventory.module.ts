import { Module } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';
import { InventoryRpcController } from './controllers/inventory.rpc.controller';
import { InventoryEventController } from './controllers/inventory.event.controller';
import { InventoryService } from './services/inventory.service';

@Module({
  controllers: [InventoryRpcController, InventoryEventController],
  providers: [InventoryService, PrismaService],
  exports: [InventoryService],
})
export class InventoryModule {}
