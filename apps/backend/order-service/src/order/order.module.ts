import { Module } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';
import { JwtStrategy } from '@omnicommerce/auth';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService, PrismaService, JwtStrategy],
})
export class OrderModule {}
