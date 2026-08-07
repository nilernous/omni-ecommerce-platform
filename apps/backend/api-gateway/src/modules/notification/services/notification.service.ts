import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NOTIFICATION_SERVICE } from '../../../common/constants/services.constant';
import { PATTERNS } from '../../../common/constants/patterns.constant';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class NotificationService {
  constructor(@Inject(NOTIFICATION_SERVICE) private readonly notificationClient: ClientProxy) {}

  listByUser(userId: string) {
    return lastValueFrom(this.notificationClient.send(PATTERNS.NOTIFICATION.LIST_BY_USER, { userId }));
  }

  markRead(id: string, userId: string) {
    return lastValueFrom(this.notificationClient.send(PATTERNS.NOTIFICATION.MARK_READ, { id, userId }));
  }
}
