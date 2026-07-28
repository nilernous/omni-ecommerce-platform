import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { createLogger, setupCors, setupGlobalPipes } from './bootstrap';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: createLogger(),
  });

  const configService = app.get(ConfigService);

  setupCors(app);
  setupGlobalPipes(app);

  const microservicePort = configService.get<number>('app.microservicePort');
  if (microservicePort) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: microservicePort,
      },
    });
    await app.startAllMicroservices();
  }

  const port = configService.get<number>('app.port') || 3003;
  await app.listen(port);
  console.log(`📦 Product Service running on HTTP port ${port} and Microservice TCP port ${microservicePort}`);
}

bootstrap();
