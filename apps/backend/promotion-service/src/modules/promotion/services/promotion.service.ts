import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class PromotionService {
  private coupons = new Map<string, any>([
    ['SUMMER10', { code: 'SUMMER10', discountType: 'PERCENTAGE', discountValue: 10, usageLimit: 100, usedCount: 0, active: true }],
    ['WELCOME20', { code: 'WELCOME20', discountType: 'PERCENTAGE', discountValue: 20, usageLimit: 100, usedCount: 0, active: true }],
  ]);
  private flashSales = new Map<string, any>();

  async validateCoupon(code: string, cartTotal = 0): Promise<any> {
    const coupon = this.getActiveCoupon(code);
    const discountAmount = this.calculateDiscount(coupon, cartTotal);

    return {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      valid: true,
    };
  }

  async redeemCoupon(code: string, userId: string, orderId: string, cartTotal: number): Promise<any> {
    const coupon = this.getActiveCoupon(code);
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit exceeded');
    }

    coupon.usedCount += 1;
    this.coupons.set(coupon.code, coupon);

    return {
      code: coupon.code,
      userId,
      orderId,
      discountAmount: this.calculateDiscount(coupon, cartTotal),
      redeemedAt: new Date().toISOString(),
    };
  }

  async createCoupon(data: any): Promise<any> {
    const code = String(data.code || '').toUpperCase();
    if (!code) {
      throw new BadRequestException('Coupon code is required');
    }
    if (this.coupons.has(code)) {
      throw new BadRequestException('Coupon already exists');
    }

    const coupon = {
      code,
      discountType: data.discountType || 'PERCENTAGE',
      discountValue: Number(data.discountValue || data.discountPercentage || 0),
      usageLimit: data.usageLimit,
      usedCount: 0,
      active: data.active ?? true,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
    };
    this.coupons.set(code, coupon);
    return coupon;
  }

  async listCoupons(): Promise<any[]> {
    return Array.from(this.coupons.values());
  }

  async scheduleFlashSale(data: any): Promise<any> {
    const id = 'FLASH-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const flashSale = {
      id,
      ...data,
      status: data.startsAt && new Date(data.startsAt).getTime() > Date.now() ? 'SCHEDULED' : 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    this.flashSales.set(id, flashSale);
    return flashSale;
  }

  private getActiveCoupon(code: string): any {
    const coupon = this.coupons.get(String(code || '').toUpperCase());
    if (!coupon || !coupon.active) {
      throw new BadRequestException('Invalid or expired coupon code');
    }
    return coupon;
  }

  private calculateDiscount(coupon: any, cartTotal: number): number {
    if (coupon.discountType === 'FIXED') {
      return Math.min(Number(coupon.discountValue), cartTotal);
    }
    return Number(((cartTotal * Number(coupon.discountValue)) / 100).toFixed(2));
  }
}
