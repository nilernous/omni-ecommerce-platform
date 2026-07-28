import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { COUPON_SERVICE } from '../../../common/constants/services.constant';
import { PATTERNS } from '../../../common/constants/patterns.constant';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class CouponService {
  constructor(@Inject(COUPON_SERVICE) private readonly couponClient: ClientProxy) {}

  apply(code: string, cartTotal: number) {
    return lastValueFrom(this.couponClient.send(PATTERNS.COUPON.APPLY, { code, cartTotal }));
  }

  validate(code: string) {
    return lastValueFrom(this.couponClient.send(PATTERNS.COUPON.VALIDATE, { code }));
  }

  create(data: any) {
    return lastValueFrom(this.couponClient.send(PATTERNS.COUPON.CREATE, data));
  }

  list() {
    return lastValueFrom(this.couponClient.send(PATTERNS.COUPON.LIST, {}));
  }
}
