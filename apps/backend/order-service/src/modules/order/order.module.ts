import { Module } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';
import { OrderRpcController } from './controllers/order.rpc.controller';
import { OrderEventController } from './controllers/order.event.controller';
import { OrderService } from './services/order.service';

@Module({
  controllers: [OrderRpcController, OrderEventController],
  providers: [OrderService, PrismaService],
  exports: [OrderService],
})
export class OrderModule {}
