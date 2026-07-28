import { Module } from '@nestjs/common';
import { CartRpcController } from './controllers/cart.rpc.controller';
import { CartEventController } from './controllers/cart.event.controller';
import { CartService } from './services/cart.service';

@Module({
  controllers: [CartRpcController, CartEventController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
