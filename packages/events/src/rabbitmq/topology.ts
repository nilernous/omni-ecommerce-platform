/**
 * Naming helpers for consumer queues bound to the domain event exchange.
 * Format (EVENT_ARCHITECTURE.md §3.2): omni.{consumer_service}.{event-name}.queue / .dlq
 */
export function serviceShortName(serviceName: string): string {
  return serviceName.replace(/-service$/, '');
}

function eventSlug(eventType: string): string {
  return eventType.replace(/[._]/g, '-');
}

export function eventQueueName(serviceName: string, eventType: string): string {
  return `omni.${serviceShortName(serviceName)}.${eventSlug(eventType)}.queue`;
}

export function eventDeadLetterQueueName(serviceName: string, eventType: string): string {
  return `omni.${serviceShortName(serviceName)}.${eventSlug(eventType)}.dlq`;
}

export const DEFAULT_RABBITMQ_URL = 'amqp://localhost:5672';

export function resolveRabbitMqUrl(url?: string): string {
  return url ?? process.env.RABBITMQ_URL ?? process.env.RABBITMQ_URI ?? DEFAULT_RABBITMQ_URL;
}
