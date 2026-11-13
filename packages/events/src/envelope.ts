import { randomUUID } from 'crypto';
import { DomainEvents } from '@omnicommerce/constants';

/**
 * Standard envelope wrapping every message published on the domain event exchange.
 * See docs/02-backend/EVENT_ARCHITECTURE.md §4.1.
 */
export interface BaseDomainEvent<T = unknown> {
  eventId: string;
  eventType: DomainEvents;
  eventVersion: string;
  producer: string;
  timestamp: string;
  correlationId?: string;
  payload: T;
}

export interface CreateEnvelopeOptions {
  producer: string;
  correlationId?: string;
  eventVersion?: string;
}

export function createEnvelope<T>(eventType: DomainEvents, payload: T, options: CreateEnvelopeOptions): BaseDomainEvent<T> {
  return {
    eventId: randomUUID(),
    eventType,
    eventVersion: options.eventVersion ?? '1.0',
    producer: options.producer,
    timestamp: new Date().toISOString(),
    correlationId: options.correlationId,
    payload,
  };
}
