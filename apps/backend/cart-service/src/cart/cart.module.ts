import { Module } from '@nestjs/common';
import { JwtStrategy } from '@omnicommerce/auth';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  controllers: [CartController],
  providers: [CartService, JwtStrategy],
})
export class CartModule {}
