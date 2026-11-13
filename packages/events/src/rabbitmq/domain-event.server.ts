import { Logger } from '@nestjs/common';
import { BaseRpcContext, CustomTransportStrategy, Server } from '@nestjs/microservices';
import * as amqp from 'amqp-connection-manager';
import type { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import type { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { lastValueFrom } from 'rxjs';
import { AMQP_EXCHANGES } from '@omnicommerce/constants';
import { BaseDomainEvent } from '../envelope';
import { eventDeadLetterQueueName, eventQueueName, resolveRabbitMqUrl } from './topology';

/** Context passed as the second argument to @EventPattern handlers (use @Ctx()). */
export class DomainEventContext extends BaseRpcContext<[BaseDomainEvent, ConsumeMessage]> {
  getEnvelope(): BaseDomainEvent {
    return this.args[0];
  }

  getMessage(): ConsumeMessage {
    return this.args[1];
  }
}

export interface DomainEventServerOptions {
  /** Consumer service name, e.g. "inventory-service". Used to name its queues. */
  serviceName: string;
  url?: string;
  prefetch?: number;
  /**
   * Delays between in-process retry attempts. Default follows EVENT_ARCHITECTURE.md §7.2:
   * attempt 1 immediately, then after 2s, 4s, 8s, 16s (5 attempts), then NACK to the DLQ.
   */
  retryDelaysMs?: number[];
}

const DEFAULT_RETRY_DELAYS_MS = [2000, 4000, 8000, 16000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Nest custom transport that subscribes every @EventPattern handler of the app to the
 * `omni.domain.events` topic exchange.
 *
 * For each handled routing key it declares a durable queue
 * `omni.{service}.{event}.queue` whose dead letters go to `omni.dead.letter` and land in
 * `omni.{service}.{event}.dlq`.
 */
export class DomainEventServer extends Server implements CustomTransportStrategy {
  protected readonly logger = new Logger(DomainEventServer.name);
  private connection?: AmqpConnectionManager;
  private channel?: ChannelWrapper;
  private readonly retryDelaysMs: number[];

  constructor(private readonly options: DomainEventServerOptions) {
    super();
    this.retryDelaysMs = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS;
  }

  /** Routing keys of the registered @EventPattern handlers. */
  getSubscribedEvents(): string[] {
    return [...this.messageHandlers.entries()].filter(([, handler]) => handler.isEventHandler).map(([pattern]) => pattern);
  }

  async listen(callback: (...optionalParams: unknown[]) => unknown): Promise<void> {
    const events = this.getSubscribedEvents();
    if (events.length === 0) {
      this.logger.log(`${this.options.serviceName} subscribes to no domain events`);
      callback();
      return;
    }

    this.connection = amqp.connect([resolveRabbitMqUrl(this.options.url)]);
    this.connection.on('disconnect', ({ err }) => this.logger.warn(`RabbitMQ disconnected: ${err?.message ?? 'unknown error'}`));
    this.channel = this.connection.createChannel({
      json: false,
      setup: (channel: ConfirmChannel) => this.setupTopology(channel, events),
    });

    callback();
    this.channel
      .waitForConnect()
      .then(() => this.logger.log(`${this.options.serviceName} subscribed to: ${events.join(', ')}`))
      .catch((error: Error) => this.logger.error(`Domain event subscription failed: ${error.message}`));
  }

  private async setupTopology(channel: ConfirmChannel, events: string[]): Promise<void> {
    await channel.assertExchange(AMQP_EXCHANGES.DOMAIN_EVENTS, 'topic', { durable: true });
    await channel.assertExchange(AMQP_EXCHANGES.DEAD_LETTER, 'direct', { durable: true });
    await channel.prefetch(this.options.prefetch ?? 10);

    for (const eventType of events) {
      const queue = eventQueueName(this.options.serviceName, eventType);
      const deadLetterQueue = eventDeadLetterQueueName(this.options.serviceName, eventType);

      await channel.assertQueue(deadLetterQueue, { durable: true });
      await channel.bindQueue(deadLetterQueue, AMQP_EXCHANGES.DEAD_LETTER, deadLetterQueue);
      await channel.assertQueue(queue, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': AMQP_EXCHANGES.DEAD_LETTER,
          'x-dead-letter-routing-key': deadLetterQueue,
        },
      });
      await channel.bindQueue(queue, AMQP_EXCHANGES.DOMAIN_EVENTS, eventType);
      await channel.consume(queue, (message) => {
        if (message) {
          void this.handleMessage(eventType, message, channel);
        }
      });
    }
  }

  /** Runs the handler with retries; ACKs on success, NACKs (→ DLQ) after the last failed attempt. */
  async handleMessage(eventType: string, message: ConsumeMessage, channel: Pick<ConfirmChannel, 'ack' | 'nack'>): Promise<void> {
    let envelope: BaseDomainEvent;
    try {
      envelope = JSON.parse(message.content.toString());
    } catch {
      this.logger.error(`Dropping unparseable ${eventType} message to DLQ`);
      channel.nack(message, false, false);
      return;
    }

    const handler = this.getHandlerByPattern(eventType);
    if (!handler) {
      this.logger.error(`No handler for ${eventType}; sending to DLQ`);
      channel.nack(message, false, false);
      return;
    }

    const context = new DomainEventContext([envelope, message]);
    const maxAttempts = this.retryDelaysMs.length + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await handler(envelope.payload, context);
        await lastValueFrom(this.transformToObservable(result), { defaultValue: undefined });
        channel.ack(message);
        return;
      } catch (error) {
        const reason = (error as { message?: string })?.message ?? JSON.stringify(error);
        if (attempt === maxAttempts) {
          this.logger.error(`${eventType} (${envelope.eventId}) failed after ${attempt} attempts, sending to DLQ: ${reason}`);
          channel.nack(message, false, false);
          return;
        }
        const delay = this.retryDelaysMs[attempt - 1];
        this.logger.warn(`${eventType} (${envelope.eventId}) attempt ${attempt} failed, retrying in ${delay}ms: ${reason}`);
        await sleep(delay);
      }
    }
  }

  async close(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }
}
