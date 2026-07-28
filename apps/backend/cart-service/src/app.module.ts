import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { CartModule } from './modules/cart/cart.module';

@Module({
  imports: [HealthModule, CartModule],
})
export class AppModule {}
