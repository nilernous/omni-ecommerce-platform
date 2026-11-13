import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { RPC_QUEUES } from '@omnicommerce/constants';
import { connectRabbitMq } from '@omnicommerce/events';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  await connectRabbitMq(app, {
    serviceName: 'order-service',
    rpcQueue: RPC_QUEUES.ORDER,
    url: configService.get<string>('rabbitmq.url'),
  });

  const port = configService.get<number>('app.port') || 3006;
  await app.listen(port);
  console.log(`📋 Order Service running on HTTP port ${port} (RPC queue: ${RPC_QUEUES.ORDER})`);
}

bootstrap();
