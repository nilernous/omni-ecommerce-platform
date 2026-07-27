import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { OmniLogger } from '@omnicommerce/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new OmniLogger(),
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`📦 Product Service running on port ${port}`);
}

bootstrap();
