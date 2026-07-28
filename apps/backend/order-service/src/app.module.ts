import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { OrderModule } from './modules/order/order.module';

@Module({
  imports: [HealthModule, OrderModule],
})
export class AppModule {}
