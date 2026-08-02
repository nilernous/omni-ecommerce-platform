import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const microservicePort = Number(process.env.MEDIA_SERVICE_TCP_PORT || 3011);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: microservicePort },
  });

  await app.startAllMicroservices();
  await app.listen(Number(process.env.MEDIA_SERVICE_PORT || 3010));
}

bootstrap();
