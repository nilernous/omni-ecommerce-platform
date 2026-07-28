import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PromotionService } from '../services/promotion.service';

@Controller()
export class PromotionRpcController {
  constructor(private readonly promotionService: PromotionService) {}

  @MessagePattern('promotion.validate_coupon')
  async validateCoupon(@Payload() data: { code: string }): Promise<any> {
    return this.promotionService.validateCoupon(data.code);
  }
}
