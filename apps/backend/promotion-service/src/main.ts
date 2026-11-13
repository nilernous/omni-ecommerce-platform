import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { RPC_QUEUES } from '@omnicommerce/constants';
import { connectRabbitMq } from '@omnicommerce/events';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  await connectRabbitMq(app, {
    serviceName: 'promotion-service',
    rpcQueue: RPC_QUEUES.PROMOTION,
    url: configService.get<string>('rabbitmq.url'),
  });

  const port = configService.get<number>('app.port') || 3009;
  await app.listen(port);
  console.log(`🎟️ Promotion Service running on HTTP port ${port} (RPC queue: ${RPC_QUEUES.PROMOTION})`);
}

bootstrap();
