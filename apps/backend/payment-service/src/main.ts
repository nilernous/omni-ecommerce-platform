import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { RPC_QUEUES } from '@omnicommerce/constants';
import { connectRabbitMq } from '@omnicommerce/events';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  await connectRabbitMq(app, {
    serviceName: 'payment-service',
    rpcQueue: RPC_QUEUES.PAYMENT,
    url: configService.get<string>('rabbitmq.url'),
  });

  const port = configService.get<number>('app.port') || 3007;
  await app.listen(port);
  console.log(`💳 Payment Service running on HTTP port ${port} (RPC queue: ${RPC_QUEUES.PAYMENT})`);
}

bootstrap();
