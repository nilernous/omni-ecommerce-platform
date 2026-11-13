import { NestFactory } from '@nestjs/core';
import { RPC_QUEUES } from '@omnicommerce/constants';
import { connectRabbitMq } from '@omnicommerce/events';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await connectRabbitMq(app, {
    serviceName: 'notification-service',
    rpcQueue: RPC_QUEUES.NOTIFICATION,
  });

  const port = Number(process.env.NOTIFICATION_SERVICE_PORT || process.env.PORT || 3013);
  await app.listen(port);
  console.log(`🔔 Notification Service running on HTTP port ${port} (RPC queue: ${RPC_QUEUES.NOTIFICATION})`);
}

bootstrap();
