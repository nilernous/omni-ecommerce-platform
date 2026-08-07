import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PromotionService } from '../services/promotion.service';

@Controller()
export class PromotionRpcController {
  constructor(private readonly promotionService: PromotionService) {}

  @MessagePattern('promotion.validate_coupon')
  @MessagePattern('coupon.validate')
  @MessagePattern('coupon.apply')
  async validateCoupon(@Payload() data: { code: string; cartTotal?: number }): Promise<any> {
    return this.promotionService.validateCoupon(data.code, data.cartTotal);
  }

  @MessagePattern('promotion.redeem_coupon')
  async redeemCoupon(@Payload() data: { code: string; userId: string; orderId: string; cartTotal: number }): Promise<any> {
    return this.promotionService.redeemCoupon(data.code, data.userId, data.orderId, data.cartTotal);
  }

  @MessagePattern('promotion.create_coupon')
  @MessagePattern('coupon.create')
  async createCoupon(@Payload() data: any): Promise<any> {
    return this.promotionService.createCoupon(data);
  }

  @MessagePattern('coupon.list')
  async listCoupons(): Promise<any> {
    return this.promotionService.listCoupons();
  }

  @MessagePattern('promotion.schedule_flash_sale')
  async scheduleFlashSale(@Payload() data: any): Promise<any> {
    return this.promotionService.scheduleFlashSale(data);
  }
}
