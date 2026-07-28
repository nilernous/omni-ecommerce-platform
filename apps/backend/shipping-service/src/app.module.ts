import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ShippingModule } from './modules/shipping/shipping.module';

@Module({
  imports: [HealthModule, ShippingModule],
})
export class AppModule {}
