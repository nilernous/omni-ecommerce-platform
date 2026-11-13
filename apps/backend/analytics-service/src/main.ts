import { NestFactory } from '@nestjs/core';
import { RPC_QUEUES } from '@omnicommerce/constants';
import { connectRabbitMq } from '@omnicommerce/events';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await connectRabbitMq(app, {
    serviceName: 'analytics-service',
    rpcQueue: RPC_QUEUES.ANALYTICS,
  });

  const port = Number(process.env.ANALYTICS_SERVICE_PORT || process.env.PORT || 3014);
  await app.listen(port);
  console.log(`📈 Analytics Service running on HTTP port ${port} (RPC queue: ${RPC_QUEUES.ANALYTICS})`);
}

bootstrap();
