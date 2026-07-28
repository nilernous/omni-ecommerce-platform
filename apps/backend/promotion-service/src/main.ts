import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createLogger, setupCors, setupGlobalPipes } from './bootstrap';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: createLogger(),
  });

  setupCors(app);
  setupGlobalPipes(app);

  const port = process.env.PORT || 3009;
  await app.listen(port);
  console.log(`🏷️ Promotion Service running on port ${port}`);
}

bootstrap();
