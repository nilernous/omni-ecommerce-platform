import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationRpcController {
  constructor(private readonly notificationService: NotificationService) {}

  @MessagePattern('notification.send')
  async send(@Payload() data: any) {
    return this.notificationService.send(data.channel || 'IN_APP', data);
  }

  @MessagePattern('notification.send_email')
  async sendEmail(@Payload() data: any) {
    return this.notificationService.send('EMAIL', data);
  }

  @MessagePattern('notification.send_sms')
  async sendSms(@Payload() data: any) {
    return this.notificationService.send('SMS', data);
  }

  @MessagePattern('notification.send_push')
  async sendPush(@Payload() data: any) {
    return this.notificationService.send('PUSH', data);
  }

  @MessagePattern('notification.list_by_user')
  async listByUser(@Payload() data: { userId: string }) {
    return this.notificationService.listByUser(data.userId);
  }

  @MessagePattern('notification.mark_read')
  async markRead(@Payload() data: { id: string; userId?: string }) {
    return this.notificationService.markRead(data.id, data.userId);
  }

  @MessagePattern('notification.retry_failed')
  async retryFailed(@Payload() data: { id: string; reason?: string }) {
    return this.notificationService.queueRetry(data.id, data.reason);
  }
}
