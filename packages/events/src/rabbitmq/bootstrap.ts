import { INestApplication, Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DomainEventServer, DomainEventServerOptions } from './domain-event.server';
import { resolveRabbitMqUrl } from './topology';

export interface RabbitMqBootstrapOptions extends Omit<DomainEventServerOptions, 'url'> {
  /** Queue the API Gateway sends request/response calls to (see RPC_QUEUES). */
  rpcQueue: string;
  url?: string;
}

/**
 * Connects the two RabbitMQ transports every backend service uses:
 * 1. RPC: @MessagePattern handlers consume `rpcQueue` (request/response from the API Gateway).
 * 2. Domain events: @EventPattern handlers subscribe to `omni.domain.events` (DomainEventServer).
 */
export async function connectRabbitMq(app: INestApplication, options: RabbitMqBootstrapOptions): Promise<void> {
  const url = resolveRabbitMqUrl(options.url);
  const rpcQueue = process.env.RABBITMQ_RPC_QUEUE ?? options.rpcQueue;

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: { urls: [url], queue: rpcQueue, queueOptions: { durable: true } },
  });
  app.connectMicroservice<MicroserviceOptions>({
    strategy: new DomainEventServer({ ...options, url }),
  });

  await app.startAllMicroservices();
  new Logger('RabbitMQ').log(`${options.serviceName} RPC queue: ${rpcQueue}`);
}
