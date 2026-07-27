import { Module } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';
import { JwtStrategy } from '@omnicommerce/auth';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, PrismaService, JwtStrategy],
})
export class InventoryModule {}
