import { Module } from '@nestjs/common';
import { PromotionRpcController } from './controllers/promotion.rpc.controller';
import { PromotionEventController } from './controllers/promotion.event.controller';
import { PromotionService } from './services/promotion.service';

@Module({
  controllers: [PromotionRpcController, PromotionEventController],
  providers: [PromotionService],
  exports: [PromotionService],
})
export class PromotionModule {}
