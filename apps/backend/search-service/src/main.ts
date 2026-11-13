import { NestFactory } from '@nestjs/core';
import { RPC_QUEUES } from '@omnicommerce/constants';
import { connectRabbitMq } from '@omnicommerce/events';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await connectRabbitMq(app, {
    serviceName: 'search-service',
    rpcQueue: RPC_QUEUES.SEARCH,
  });

  const port = Number(process.env.SEARCH_SERVICE_PORT || process.env.PORT || 3012);
  await app.listen(port);
  console.log(`🔎 Search Service running on HTTP port ${port} (RPC queue: ${RPC_QUEUES.SEARCH})`);
}

bootstrap();
