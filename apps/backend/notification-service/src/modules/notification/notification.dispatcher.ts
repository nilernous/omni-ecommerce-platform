import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import type { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import type { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { AMQP_EXCHANGES } from '@omnicommerce/constants';
import { resolveRabbitMqUrl } from '@omnicommerce/events';
import { NotificationStore } from './notification.store';
import { DispatchJob, NOTIFICATION_PROVIDER, NotificationProvider } from './notification.providers';
import {
  DISPATCH_QUEUES,
  DispatchChannel,
  NOTIFICATION_DLQ,
  NOTIFICATION_DLQ_ROUTING_KEY,
  NOTIFICATION_EXCHANGES,
  RETRY_COUNT_HEADER,
  RETRY_STEPS,
  channelRoutingKey,
  retryRoutingKey,
} from './notification.topology';

/**
 * NOTIF-BR-06 / NOTIF-BR-07: queues outbound notifications on RabbitMQ and delivers them with
 * TTL + DLX delayed retries (10s, 30s, 90s), then parks them in omni.notification.dlq.
 */
@Injectable()
export class NotificationDispatcher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationDispatcher.name);
  private connection?: AmqpConnectionManager;
  private channel?: ChannelWrapper;

  constructor(
    private readonly store: NotificationStore,
    @Inject(NOTIFICATION_PROVIDER) private readonly provider: NotificationProvider,
  ) {}

  onModuleInit(): void {
    this.connection = amqp.connect([resolveRabbitMqUrl()]);
    this.connection.on('disconnect', ({ err }) => this.logger.warn(`RabbitMQ disconnected: ${err?.message ?? 'unknown error'}`));
    this.channel = this.connection.createChannel({
      json: false,
      publishTimeout: 5000,
      setup: (channel: ConfirmChannel) => this.setupTopology(channel),
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  /** Queues a job for delivery. The notification record must already exist (status PENDING). */
  async enqueue(job: DispatchJob): Promise<void> {
    await this.publish(NOTIFICATION_EXCHANGES.DISPATCH, channelRoutingKey(job.channel), job, 0);
  }

  private async setupTopology(channel: ConfirmChannel): Promise<void> {
    await channel.assertExchange(NOTIFICATION_EXCHANGES.DISPATCH, 'topic', { durable: true });
    await channel.assertExchange(NOTIFICATION_EXCHANGES.RETRY, 'topic', { durable: true });
    await channel.assertExchange(AMQP_EXCHANGES.DEAD_LETTER, 'direct', { durable: true });

    for (const step of RETRY_STEPS) {
      await channel.assertQueue(step.queue, {
        durable: true,
        arguments: { 'x-message-ttl': step.ttlMs, 'x-dead-letter-exchange': NOTIFICATION_EXCHANGES.DISPATCH },
      });
      await channel.bindQueue(step.queue, NOTIFICATION_EXCHANGES.RETRY, `*.retry.${step.label}`);
    }

    await channel.assertQueue(NOTIFICATION_DLQ, { durable: true });
    await channel.bindQueue(NOTIFICATION_DLQ, AMQP_EXCHANGES.DEAD_LETTER, NOTIFICATION_DLQ_ROUTING_KEY);

    await channel.prefetch(10);
    for (const [channelName, queue] of Object.entries(DISPATCH_QUEUES) as Array<[DispatchChannel, string]>) {
      await channel.assertQueue(queue, { durable: true });
      await channel.bindQueue(queue, NOTIFICATION_EXCHANGES.DISPATCH, `${channelRoutingKey(channelName)}.#`);
      await channel.consume(queue, (message) => {
        if (message) {
          void this.handleDispatch(channelName, message, channel);
        }
      });
    }
    this.logger.log('Notification dispatch/retry topology ready');
  }

  async handleDispatch(channelName: DispatchChannel, message: ConsumeMessage, channel: Pick<ConfirmChannel, 'ack'>): Promise<void> {
    let job: DispatchJob;
    try {
      job = JSON.parse(message.content.toString());
    } catch {
      this.logger.error(`Dropping unparseable ${channelName} dispatch message`);
      channel.ack(message);
      return;
    }
    const retryCount = Number(message.properties.headers?.[RETRY_COUNT_HEADER] ?? 0);
    const record = this.store.find(job.notificationId);

    try {
      await this.provider.send(job);
      if (record) {
        this.store.update(job.notificationId, { status: 'SENT', attempts: retryCount + 1, sentAt: new Date().toISOString(), errorMessage: undefined });
      }
    } catch (error) {
      const reason = (error as Error).message;
      if (record) {
        this.store.update(job.notificationId, { attempts: retryCount + 1, errorMessage: reason });
      }

      if (retryCount < RETRY_STEPS.length) {
        const step = RETRY_STEPS[retryCount];
        this.logger.warn(`${channelName} ${job.notificationId} failed (attempt ${retryCount + 1}), retrying in ${step.label}: ${reason}`);
        await this.publish(NOTIFICATION_EXCHANGES.RETRY, retryRoutingKey(channelName, retryCount), job, retryCount + 1);
      } else {
        this.logger.error(`${channelName} ${job.notificationId} failed after ${retryCount + 1} attempts, moving to ${NOTIFICATION_DLQ}: ${reason}`);
        await this.publish(AMQP_EXCHANGES.DEAD_LETTER, NOTIFICATION_DLQ_ROUTING_KEY, job, retryCount);
        if (record) {
          this.store.update(job.notificationId, { status: 'FAILED' });
        }
      }
    }
    channel.ack(message);
  }

  private async publish(exchange: string, routingKey: string, job: DispatchJob, retryCount: number): Promise<void> {
    if (!this.channel) {
      throw new Error('Notification dispatcher is not initialized');
    }
    await this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(job)), {
      persistent: true,
      contentType: 'application/json',
      messageId: job.notificationId,
      headers: { [RETRY_COUNT_HEADER]: retryCount },
    });
  }
}
