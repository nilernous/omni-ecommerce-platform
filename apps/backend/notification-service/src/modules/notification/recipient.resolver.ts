import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { RPC_QUEUES } from '@omnicommerce/constants';
import { resolveRabbitMqUrl } from '@omnicommerce/events';
import { firstValueFrom, timeout } from 'rxjs';

export const IDENTITY_CLIENT = Symbol('IDENTITY_CLIENT');
export const ORDER_CLIENT = Symbol('ORDER_CLIENT');

export interface Recipient {
  userId: string;
  email?: string;
  phoneNumber?: string | null;
}

function rpcClient(queue: string): ClientProxy {
  return ClientProxyFactory.create({
    transport: Transport.RMQ,
    options: { urls: [resolveRabbitMqUrl()], queue, queueOptions: { durable: true } },
  });
}

export const recipientClientProviders = [
  { provide: IDENTITY_CLIENT, useFactory: () => rpcClient(RPC_QUEUES.IDENTITY) },
  { provide: ORDER_CLIENT, useFactory: () => rpcClient(RPC_QUEUES.ORDER) },
];

/**
 * Looks up who to notify. Payment and shipping events only carry an orderId, so the owner is
 * read from order-service, and contact details from identity-service (NOTIF-UC-03).
 * A failed lookup throws, so the domain event is retried and eventually dead-lettered.
 */
@Injectable()
export class RecipientResolver implements OnModuleDestroy {
  private readonly timeoutMs = 5000;

  constructor(
    @Inject(IDENTITY_CLIENT) private readonly identityClient: ClientProxy,
    @Inject(ORDER_CLIENT) private readonly orderClient: ClientProxy,
  ) {}

  async byUserId(userId: string): Promise<Recipient> {
    const user = await firstValueFrom(this.identityClient.send('user.get_by_id', { id: userId }).pipe(timeout(this.timeoutMs)));
    return { userId, email: user?.email, phoneNumber: user?.phoneNumber };
  }

  async byOrderId(orderId: string): Promise<Recipient & { orderNumber?: string }> {
    const order = await firstValueFrom(this.orderClient.send('order.get_by_id', { id: orderId }).pipe(timeout(this.timeoutMs)));
    const recipient = await this.byUserId(order.userId);
    return { ...recipient, orderNumber: order.orderNumber };
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([this.identityClient.close(), this.orderClient.close()]);
  }
}
