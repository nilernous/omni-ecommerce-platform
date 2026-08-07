import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const microservicePort = Number(process.env.NOTIFICATION_SERVICE_TCP_PORT || 3013);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: microservicePort },
  });

  await app.startAllMicroservices();
  await app.listen(Number(process.env.NOTIFICATION_SERVICE_PORT || 3012));
}

bootstrap();
