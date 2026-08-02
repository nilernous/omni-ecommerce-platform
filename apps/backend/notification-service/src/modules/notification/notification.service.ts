import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

type NotificationChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';

@Injectable()
export class NotificationService {
  private notifications = new Map<string, any>();
  private retryQueue: any[] = [];

  async send(channel: NotificationChannel, data: any): Promise<any> {
    if (!data.userId && !data.to) {
      throw new BadRequestException('Notification recipient is required');
    }

    const notification = {
      id: 'NOTIF-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      channel,
      userId: data.userId,
      to: data.to,
      subject: data.subject,
      template: data.template,
      body: data.body,
      payload: data.payload,
      readAt: null,
      status: 'SENT',
      attempts: 1,
      createdAt: new Date().toISOString(),
    };

    this.notifications.set(notification.id, notification);
    return notification;
  }

  async listByUser(userId: string): Promise<any[]> {
    return Array.from(this.notifications.values()).filter((notification) => notification.userId === userId);
  }

  async markRead(id: string, userId?: string): Promise<any> {
    const notification = this.notifications.get(id);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    if (userId && notification.userId !== userId) {
      throw new BadRequestException('Notification does not belong to user');
    }

    const updated = { ...notification, readAt: new Date().toISOString() };
    this.notifications.set(id, updated);
    return updated;
  }

  async queueRetry(notificationId: string, reason?: string): Promise<any> {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const retry = {
      notificationId,
      reason,
      attempts: notification.attempts + 1,
      queuedAt: new Date().toISOString(),
    };
    this.retryQueue.push(retry);
    this.notifications.set(notificationId, { ...notification, status: 'RETRY_QUEUED', attempts: retry.attempts });
    return retry;
  }
}
