import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PAYMENT_SERVICE } from '../../../common/constants/services.constant';
import { PATTERNS } from '../../../common/constants/patterns.constant';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class PaymentService {
  constructor(@Inject(PAYMENT_SERVICE) private readonly paymentClient: ClientProxy) {}

  createIntent(userId: string, data: any) {
    return lastValueFrom(this.paymentClient.send(PATTERNS.PAYMENT.CREATE_INTENT, { userId, ...data }));
  }

  process(userId: string, data: any) {
    return lastValueFrom(this.paymentClient.send(PATTERNS.PAYMENT.PROCESS, { userId, ...data }));
  }

  getById(id: string) {
    return lastValueFrom(this.paymentClient.send(PATTERNS.PAYMENT.GET_BY_ID, { id }));
  }

  handleWebhook(payload: any) {
    return lastValueFrom(this.paymentClient.send(PATTERNS.PAYMENT.WEBHOOK, payload));
  }
}
