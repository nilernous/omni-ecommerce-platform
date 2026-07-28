import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SHIPPING_SERVICE } from '../../../common/constants/services.constant';
import { PATTERNS } from '../../../common/constants/patterns.constant';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ShippingService {
  constructor(@Inject(SHIPPING_SERVICE) private readonly shippingClient: ClientProxy) {}

  calculateRates(data: any) {
    return lastValueFrom(this.shippingClient.send(PATTERNS.SHIPPING.CALCULATE_RATES, data));
  }

  createShipment(data: any) {
    return lastValueFrom(this.shippingClient.send(PATTERNS.SHIPPING.CREATE_SHIPMENT, data));
  }

  track(trackingNumber: string) {
    return lastValueFrom(this.shippingClient.send(PATTERNS.SHIPPING.TRACK, { trackingNumber }));
  }
}
