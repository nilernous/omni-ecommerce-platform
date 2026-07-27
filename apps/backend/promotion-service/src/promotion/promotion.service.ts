import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class PromotionService {
  private coupons = new Map<string, number>([
    ['SUMMER10', 10],
    ['WELCOME20', 20],
  ]);

  async validateCoupon(code: string): Promise<any> {
    const discount = this.coupons.get(code.toUpperCase());
    if (!discount) {
      throw new BadRequestException('Invalid or expired coupon code');
    }
    return {
      code: code.toUpperCase(),
      discountPercentage: discount,
      valid: true,
    };
  }
}
