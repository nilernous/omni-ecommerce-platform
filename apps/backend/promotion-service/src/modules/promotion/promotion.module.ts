import { Module } from '@nestjs/common';
import { PromotionController } from './presentation/controllers/promotion.controller';
import { PromotionService } from './application/services/promotion.service';

@Module({
  controllers: [PromotionController],
  providers: [PromotionService],
})
export class PromotionModule {}
