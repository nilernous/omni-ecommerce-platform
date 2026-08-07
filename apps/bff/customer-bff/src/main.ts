import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { OmniLogger } from '@omnicommerce/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new OmniLogger(),
  });

  const port = process.env.PORT || 4001;
  await app.listen(port);
  console.log(`🛍️ Customer BFF running on port ${port}`);
}

bootstrap();
