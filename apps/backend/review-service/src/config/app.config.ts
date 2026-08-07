import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME || 'review-service',
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3010', 10),
  microserviceHost: process.env.MICROSERVICE_HOST || '127.0.0.1',
  microservicePort: parseInt(process.env.MICROSERVICE_PORT || '4010', 10),
}));
