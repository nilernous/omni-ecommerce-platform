import { Module } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';
import { ShippingRpcController } from './controllers/shipping.rpc.controller';
import { ShippingEventController } from './controllers/shipping.event.controller';
import { ShippingService } from './services/shipping.service';

@Module({
  controllers: [ShippingRpcController, ShippingEventController],
  providers: [ShippingService, PrismaService],
  exports: [ShippingService],
})
export class ShippingModule {}
