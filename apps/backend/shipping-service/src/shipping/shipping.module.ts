import { Module } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';
import { JwtStrategy } from '@omnicommerce/auth';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';

@Module({
  controllers: [ShippingController],
  providers: [ShippingService, PrismaService, JwtStrategy],
})
export class ShippingModule {}
