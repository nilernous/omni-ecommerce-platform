import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ORDER_SERVICE } from '../../../common/constants/services.constant';
import { PATTERNS } from '../../../common/constants/patterns.constant';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class OrderService {
  constructor(@Inject(ORDER_SERVICE) private readonly orderClient: ClientProxy) {}

  create(userId: string, data: any) {
    return lastValueFrom(this.orderClient.send(PATTERNS.ORDER.CREATE, { userId, ...data }));
  }

  getById(id: string) {
    return lastValueFrom(this.orderClient.send(PATTERNS.ORDER.GET_BY_ID, { id }));
  }

  listByUser(userId: string, query: any) {
    return lastValueFrom(this.orderClient.send(PATTERNS.ORDER.LIST_BY_USER, { userId, ...query }));
  }

  cancel(id: string, userId: string) {
    return lastValueFrom(this.orderClient.send(PATTERNS.ORDER.CANCEL, { id, userId }));
  }

  updateStatus(id: string, status: string) {
    return lastValueFrom(this.orderClient.send(PATTERNS.ORDER.UPDATE_STATUS, { id, status }));
  }
}
