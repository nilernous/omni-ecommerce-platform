import { NestFactory } from '@nestjs/core';
import { RPC_QUEUES } from '@omnicommerce/constants';
import { connectRabbitMq } from '@omnicommerce/events';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await connectRabbitMq(app, {
    serviceName: 'media-service',
    rpcQueue: RPC_QUEUES.MEDIA,
  });

  const port = Number(process.env.MEDIA_SERVICE_PORT || process.env.PORT || 3011);
  await app.listen(port);
  console.log(`🖼️ Media Service running on HTTP port ${port} (RPC queue: ${RPC_QUEUES.MEDIA})`);
}

bootstrap();
