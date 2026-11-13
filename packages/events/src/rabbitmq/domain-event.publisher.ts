import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import type { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import type { ConfirmChannel } from 'amqplib';
import { AMQP_EXCHANGES, CORRELATION_ID_HEADER, DomainEvents } from '@omnicommerce/constants';
import { BaseDomainEvent, createEnvelope } from '../envelope';
import { DomainEventPayloadMap } from '../payloads';
import { resolveRabbitMqUrl } from './topology';

export const EVENT_BUS_OPTIONS = Symbol('EVENT_BUS_OPTIONS');

export interface EventBusOptions {
  /** Producer name written into every envelope, e.g. "order-service". */
  serviceName: string;
  /** Defaults to RABBITMQ_URL, then amqp://localhost:5672. */
  url?: string;
  /** How long a publish may wait for the broker before it is reported as failed. */
  publishTimeoutMs?: number;
}

export interface PublishOptions {
  correlationId?: string;
}

/**
 * Publishes domain events to the `omni.domain.events` topic exchange.
 *
 * Publishing happens after the local state change has been committed. Until the
 * transactional outbox is in place, a failed publish is logged and does not fail
 * the business operation (see EVENT_ARCHITECTURE.md §6.1).
 */
@Injectable()
export class DomainEventPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(DomainEventPublisher.name);
  private readonly connection: AmqpConnectionManager;
  private readonly channel: ChannelWrapper;

  constructor(@Inject(EVENT_BUS_OPTIONS) private readonly options: EventBusOptions) {
    this.connection = amqp.connect([resolveRabbitMqUrl(options.url)]);
    this.connection.on('disconnect', ({ err }) => this.logger.warn(`RabbitMQ disconnected: ${err?.message ?? 'unknown error'}`));
    this.channel = this.connection.createChannel({
      json: false,
      publishTimeout: options.publishTimeoutMs ?? 5000,
      setup: (channel: ConfirmChannel) => channel.assertExchange(AMQP_EXCHANGES.DOMAIN_EVENTS, 'topic', { durable: true }),
    });
  }

  async publish<K extends keyof DomainEventPayloadMap>(
    eventType: K,
    payload: DomainEventPayloadMap[K],
    options: PublishOptions = {},
  ): Promise<BaseDomainEvent<DomainEventPayloadMap[K]> | null> {
    const envelope = createEnvelope(eventType as DomainEvents, payload, {
      producer: this.options.serviceName,
      correlationId: options.correlationId,
    });

    try {
      await this.channel.publish(AMQP_EXCHANGES.DOMAIN_EVENTS, eventType, Buffer.from(JSON.stringify(envelope)), {
        persistent: true,
        contentType: 'application/json',
        messageId: envelope.eventId,
        timestamp: Date.now(),
        type: eventType,
        appId: this.options.serviceName,
        headers: options.correlationId ? { [CORRELATION_ID_HEADER]: options.correlationId } : {},
      });
      this.logger.debug(`Published ${eventType} (${envelope.eventId})`);
      return envelope;
    } catch (error) {
      this.logger.error(`Failed to publish ${eventType}: ${(error as Error).message}`);
      return null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel.close().catch(() => undefined);
    await this.connection.close().catch(() => undefined);
  }
}
