import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME || 'cart-service',
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3005', 10),
  microserviceHost: process.env.MICROSERVICE_HOST || '127.0.0.1',
  microservicePort: parseInt(process.env.MICROSERVICE_PORT || '4005', 10),
}));
