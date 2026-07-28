import { Module } from '@nestjs/common';
import { JwtStrategy } from '@omnicommerce/auth';
import { CartController } from './presentation/controllers/cart.controller';
import { CartService } from './application/services/cart.service';

@Module({
  controllers: [CartController],
  providers: [CartService, JwtStrategy],
})
export class CartModule {}
