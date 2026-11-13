import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DomainEvents } from '@omnicommerce/constants';
import { DomainEventPublisher } from '@omnicommerce/events';

@Injectable()
export class PromotionService {
  private coupons = new Map<string, any>([
    ['SUMMER10', { code: 'SUMMER10', discountType: 'PERCENTAGE', discountValue: 10, usageLimit: 100, usedCount: 0, active: true }],
    ['WELCOME20', { code: 'WELCOME20', discountType: 'PERCENTAGE', discountValue: 20, usageLimit: 100, usedCount: 0, active: true }],
  ]);
  private flashSales = new Map<string, any>();
  /** orderId -> redeemed coupon code, so a cancelled order can revert its redemption (PROM-BR-14). */
  private redemptionsByOrder = new Map<string, string>();
  private readonly logger = new Logger(PromotionService.name);

  constructor(private readonly events: DomainEventPublisher) {}

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

    if (this.redemptionsByOrder.has(orderId)) {
      throw new BadRequestException('Order already redeemed a coupon');
    }

    coupon.usedCount += 1;
    this.coupons.set(coupon.code, coupon);
    this.redemptionsByOrder.set(orderId, coupon.code);

    const redemption = {
      code: coupon.code,
      userId,
      orderId,
      discountAmount: this.calculateDiscount(coupon, cartTotal),
      redeemedAt: new Date().toISOString(),
    };
    await this.events.publish(DomainEvents.PROMOTION_COUPON_REDEEMED, {
      code: redemption.code,
      userId,
      orderId,
      discountAmount: redemption.discountAmount,
    }); // PROM-BR-11
    return redemption;
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
    if (flashSale.status === 'ACTIVE') {
      await this.events.publish(DomainEvents.PROMOTION_FLASH_SALE_STARTED, {
        flashSaleId: id,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
      }); // PROM-BR-12
    }
    return flashSale;
  }

  /** PROM-BR-13: record the coupon used by a new order (idempotent per order). */
  async redeemForOrder(orderId: string, userId: string, code: string, orderTotal: number): Promise<void> {
    if (this.redemptionsByOrder.has(orderId)) {
      return;
    }
    try {
      await this.redeemCoupon(code, userId, orderId, orderTotal);
    } catch (error) {
      // Invalid / exhausted coupons are a business outcome, not a transient failure: do not retry.
      this.logger.warn(`[PROM-BR-13] Coupon ${code} not redeemed for order ${orderId}: ${(error as Error).message}`);
    }
  }

  /** PROM-BR-14: give the coupon usage back when its order is cancelled. */
  async revertForOrder(orderId: string): Promise<void> {
    const code = this.redemptionsByOrder.get(orderId);
    if (!code) {
      return;
    }
    const coupon = this.coupons.get(code);
    if (coupon && coupon.usedCount > 0) {
      coupon.usedCount -= 1;
    }
    this.redemptionsByOrder.delete(orderId);
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
