import { Injectable, Logger } from '@nestjs/common';
import { DispatchChannel } from './notification.topology';

export interface DispatchJob {
  notificationId: string;
  channel: DispatchChannel;
  to?: string;
  userId?: string;
  subject?: string;
  body?: string;
}

/** Sends one job through the channel's provider; throws on delivery failure. */
export interface NotificationProvider {
  send(job: DispatchJob): Promise<void>;
}

/**
 * Placeholder provider until SMTP (Nodemailer / SendGrid), Twilio and FCM are integrated.
 * It logs the message instead of delivering it.
 *
 * Set NOTIFICATION_FAIL_CHANNELS=email,sms to make those channels fail, which exercises the
 * RabbitMQ retry queues and the DLQ locally.
 */
@Injectable()
export class LoggingNotificationProvider implements NotificationProvider {
  private readonly logger = new Logger(LoggingNotificationProvider.name);
  private readonly failingChannels = new Set(
    (process.env.NOTIFICATION_FAIL_CHANNELS ?? '')
      .split(',')
      .map((channel) => channel.trim().toUpperCase())
      .filter(Boolean),
  );

  async send(job: DispatchJob): Promise<void> {
    if (this.failingChannels.has(job.channel)) {
      throw new Error(`${job.channel} provider unavailable (NOTIFICATION_FAIL_CHANNELS)`);
    }
    this.logger.log(`[${job.channel}] -> ${job.to ?? job.userId ?? 'unknown'}: ${job.subject ?? ''} ${job.body ?? ''}`.trim());
  }
}

export const NOTIFICATION_PROVIDER = Symbol('NOTIFICATION_PROVIDER');
