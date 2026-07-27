import { Module } from '@nestjs/common';
import { PromotionModule } from './promotion/promotion.module';

@Module({
  imports: [PromotionModule],
})
export class AppModule {}
