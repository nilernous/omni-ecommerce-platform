import { BadRequestException, Injectable } from '@nestjs/common';
import { NotificationChannel, NotificationRecord, NotificationStore } from './notification.store';
import { NotificationDispatcher } from './notification.dispatcher';

export interface SendNotificationInput {
  userId?: string;
  to?: string;
  subject?: string;
  template?: string;
  body?: string;
  payload?: unknown;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly store: NotificationStore,
    private readonly dispatcher: NotificationDispatcher,
  ) {}

  /**
   * Records a notification and hands it to the RabbitMQ dispatcher (NOTIF-BR-06).
   * IN_APP notifications are only stored: the client reads them via notification.list_by_user.
   */
  async send(channel: NotificationChannel, data: SendNotificationInput): Promise<NotificationRecord> {
    if (!data.userId && !data.to) {
      throw new BadRequestException('Notification recipient is required');
    }

    const record = this.store.create({
      channel,
      userId: data.userId,
      to: data.to,
      subject: data.subject,
      template: data.template,
      body: data.body,
      payload: data.payload,
      status: channel === 'IN_APP' ? 'SENT' : 'PENDING',
    });

    if (channel !== 'IN_APP') {
      await this.dispatcher.enqueue({
        notificationId: record.id,
        channel,
        to: record.to,
        userId: record.userId,
        subject: record.subject,
        body: record.body,
      });
    }
    return record;
  }

  async listByUser(userId: string): Promise<NotificationRecord[]> {
    return this.store.listByUser(userId);
  }

  async markRead(id: string, userId?: string): Promise<NotificationRecord> {
    const notification = this.store.get(id);
    if (userId && notification.userId !== userId) {
      throw new BadRequestException('Notification does not belong to user');
    }
    return this.store.update(id, { readAt: new Date().toISOString() });
  }

  /** Manually re-queues a FAILED notification (e.g. after it was inspected in the DLQ). */
  async queueRetry(notificationId: string, reason?: string): Promise<NotificationRecord> {
    const notification = this.store.get(notificationId);
    if (notification.channel === 'IN_APP') {
      throw new BadRequestException('In-app notifications are not dispatched');
    }
    const updated = this.store.update(notificationId, { status: 'PENDING', errorMessage: reason });
    await this.dispatcher.enqueue({
      notificationId,
      channel: notification.channel,
      to: notification.to,
      userId: notification.userId,
      subject: notification.subject,
      body: notification.body,
    });
    return updated;
  }
}
