import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import {
  AUTH_SERVICE,
  USER_SERVICE,
  PRODUCT_SERVICE,
  CATEGORY_SERVICE,
  INVENTORY_SERVICE,
  CART_SERVICE,
  ORDER_SERVICE,
  PAYMENT_SERVICE,
  SHIPPING_SERVICE,
  COUPON_SERVICE,
  REVIEW_SERVICE,
  NOTIFICATION_SERVICE,
  ANALYTICS_SERVICE,
} from '../../common/constants/services.constant';
import {
  IDENTITY_QUEUE,
  PRODUCT_QUEUE,
  CATEGORY_QUEUE,
  INVENTORY_QUEUE,
  CART_QUEUE,
  ORDER_QUEUE,
  PAYMENT_QUEUE,
  SHIPPING_QUEUE,
  COUPON_QUEUE,
  NOTIFICATION_QUEUE,
  ANALYTICS_QUEUE,
} from '../../common/constants/queues.constant';

function createRmqClientProvider(provideToken: string, queueName: string) {
  return {
    provide: provideToken,
    useFactory: (configService: ConfigService) => {
      const rmqUri = configService.get<string>('rabbitmq.uri') || 'amqp://localhost:5672';
      return ClientProxyFactory.create({
        transport: Transport.RMQ,
        options: {
          urls: [rmqUri],
          queue: queueName,
          queueOptions: {
            durable: true,
          },
        },
      });
    },
    inject: [ConfigService],
  };
}

export const clientsProviders = [
  // AUTH_SERVICE and USER_SERVICE are both served by identity-service
  createRmqClientProvider(AUTH_SERVICE, IDENTITY_QUEUE),
  createRmqClientProvider(USER_SERVICE, IDENTITY_QUEUE),
  createRmqClientProvider(PRODUCT_SERVICE, PRODUCT_QUEUE),
  createRmqClientProvider(CATEGORY_SERVICE, CATEGORY_QUEUE),
  createRmqClientProvider(INVENTORY_SERVICE, INVENTORY_QUEUE),
  createRmqClientProvider(CART_SERVICE, CART_QUEUE),
  createRmqClientProvider(ORDER_SERVICE, ORDER_QUEUE),
  createRmqClientProvider(PAYMENT_SERVICE, PAYMENT_QUEUE),
  createRmqClientProvider(SHIPPING_SERVICE, SHIPPING_QUEUE),
  createRmqClientProvider(COUPON_SERVICE, COUPON_QUEUE),
  // Reviews are a module of product-service
  createRmqClientProvider(REVIEW_SERVICE, PRODUCT_QUEUE),
  createRmqClientProvider(NOTIFICATION_SERVICE, NOTIFICATION_QUEUE),
  createRmqClientProvider(ANALYTICS_SERVICE, ANALYTICS_QUEUE),
];

