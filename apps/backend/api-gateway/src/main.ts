import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { OmniLogger } from '@omnicommerce/logger';
import proxy from 'express-http-proxy';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new OmniLogger(),
  });

  app.enableCors();
  app.setGlobalPrefix('api/v1');

  // Proxy routing map for microservices
  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.use('/api/v1/auth', proxy(process.env.AUTH_SERVICE_URL || 'http://localhost:3001'));
  expressApp.use('/api/v1/users', proxy(process.env.USER_SERVICE_URL || 'http://localhost:3002'));
  expressApp.use('/api/v1/products', proxy(process.env.PRODUCT_SERVICE_URL || 'http://localhost:3003'));
  expressApp.use('/api/v1/inventory', proxy(process.env.INVENTORY_SERVICE_URL || 'http://localhost:3004'));
  expressApp.use('/api/v1/cart', proxy(process.env.CART_SERVICE_URL || 'http://localhost:3005'));
  expressApp.use('/api/v1/orders', proxy(process.env.ORDER_SERVICE_URL || 'http://localhost:3006'));
  expressApp.use('/api/v1/payments', proxy(process.env.PAYMENT_SERVICE_URL || 'http://localhost:3007'));
  expressApp.use('/api/v1/shipping', proxy(process.env.SHIPPING_SERVICE_URL || 'http://localhost:3008'));
  expressApp.use('/api/v1/promotions', proxy(process.env.PROMOTION_SERVICE_URL || 'http://localhost:3009'));
  expressApp.use('/api/v1/reviews', proxy(process.env.REVIEW_SERVICE_URL || 'http://localhost:3010'));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 API Gateway running on port ${port}`);
}

bootstrap();
