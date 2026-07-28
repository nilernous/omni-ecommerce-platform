import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { OmniLogger } from '@omnicommerce/logger';
import proxy from 'express-http-proxy';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new OmniLogger(),
  });

  const configService = app.get(ConfigService);

  app.enableCors();
  app.setGlobalPrefix('api/v1');

  // Proxy routing map for microservices loaded via Nest Config
  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.use('/api/v1/auth', proxy(configService.get<string>('app.authServiceUrl') || 'http://localhost:3001'));
  expressApp.use('/api/v1/users', proxy(configService.get<string>('app.userServiceUrl') || 'http://localhost:3002'));
  expressApp.use('/api/v1/products', proxy(configService.get<string>('app.productServiceUrl') || 'http://localhost:3003'));
  expressApp.use('/api/v1/inventory', proxy(configService.get<string>('app.inventoryServiceUrl') || 'http://localhost:3004'));
  expressApp.use('/api/v1/cart', proxy(configService.get<string>('app.cartServiceUrl') || 'http://localhost:3005'));
  expressApp.use('/api/v1/orders', proxy(configService.get<string>('app.orderServiceUrl') || 'http://localhost:3006'));
  expressApp.use('/api/v1/payments', proxy(configService.get<string>('app.paymentServiceUrl') || 'http://localhost:3007'));
  expressApp.use('/api/v1/shipping', proxy(configService.get<string>('app.shippingServiceUrl') || 'http://localhost:3008'));
  expressApp.use('/api/v1/promotions', proxy(configService.get<string>('app.promotionServiceUrl') || 'http://localhost:3009'));
  expressApp.use('/api/v1/reviews', proxy(configService.get<string>('app.reviewServiceUrl') || 'http://localhost:3010'));

  const port = configService.get<number>('app.port') || 3000;
  await app.listen(port);
  console.log(`🚀 API Gateway running on port ${port}`);
}

bootstrap();
