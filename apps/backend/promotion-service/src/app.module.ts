import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { PromotionModule } from './modules/promotion/promotion.module';

@Module({
  imports: [HealthModule, PromotionModule],
})
export class AppModule {}
