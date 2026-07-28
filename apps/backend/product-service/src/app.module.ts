import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ProductModule } from './modules/product/product.module';

@Module({
  imports: [HealthModule, ProductModule],
})
export class AppModule {}
