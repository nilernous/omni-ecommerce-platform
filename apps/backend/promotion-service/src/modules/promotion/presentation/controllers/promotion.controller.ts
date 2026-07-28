import { Controller, Post, Body } from '@nestjs/common';
import { PromotionService } from '../../application/services/promotion.service';

@Controller()
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Post('validate')
  async validateCoupon(@Body('code') code: string): Promise<any> {
    return this.promotionService.validateCoupon(code);
  }
}
