import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME || 'shipping-service',
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3008', 10),
  microserviceHost: process.env.MICROSERVICE_HOST || '127.0.0.1',
  microservicePort: parseInt(process.env.MICROSERVICE_PORT || '4008', 10),
  jwtSecret: process.env.JWT_SECRET || 'omnicommerce_super_secret_jwt_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
}));
