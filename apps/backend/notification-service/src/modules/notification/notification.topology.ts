/**
 * RabbitMQ topology for outbound notification jobs (EVENT_ARCHITECTURE.md §7.4, NOTIF-BR-06/07).
 * These exchanges carry dispatch jobs, not domain events.
 */
export type DispatchChannel = 'EMAIL' | 'SMS' | 'PUSH';

export const NOTIFICATION_EXCHANGES = {
  DISPATCH: 'omni.notification.dispatch',
  RETRY: 'omni.notification.retry',
} as const;

export const DISPATCH_QUEUES: Record<DispatchChannel, string> = {
  EMAIL: 'omni.notification.email-dispatch.queue',
  SMS: 'omni.notification.sms-dispatch.queue',
  PUSH: 'omni.notification.push-dispatch.queue',
};

/** NOTIF-BR-07: 3 retries with 10s, 30s, 90s backoff. */
export const RETRY_STEPS = [
  { label: '10s', ttlMs: 10_000, queue: 'omni.notification.retry-10s.queue' },
  { label: '30s', ttlMs: 30_000, queue: 'omni.notification.retry-30s.queue' },
  { label: '90s', ttlMs: 90_000, queue: 'omni.notification.retry-90s.queue' },
] as const;

export const NOTIFICATION_DLQ = 'omni.notification.dlq';
export const NOTIFICATION_DLQ_ROUTING_KEY = 'dlq.notification';
export const RETRY_COUNT_HEADER = 'x-retry-count';

export function channelRoutingKey(channel: DispatchChannel): string {
  return channel.toLowerCase();
}

export function retryRoutingKey(channel: DispatchChannel, retryIndex: number): string {
  return `${channelRoutingKey(channel)}.retry.${RETRY_STEPS[retryIndex].label}`;
}
