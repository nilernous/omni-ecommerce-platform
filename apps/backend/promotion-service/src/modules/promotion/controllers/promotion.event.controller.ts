import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PromotionService } from '../services/promotion.service';

@Controller()
export class PromotionEventController {
  constructor(private readonly promotionService: PromotionService) {}

  @EventPattern('promotion.created')
  async handlePromotionCreated(@Payload() data: any) {
    // Event handler placeholder
  }
}
