import { registerAs } from '@nestjs/config';

export default registerAs('swagger', () => ({
  enabled: process.env.SWAGGER_ENABLED !== 'false',
  title: 'OmniCommerce API Gateway',
  description: 'Centralized Edge API Gateway REST Endpoints for OmniCommerce Microservices',
  version: '1.0.0',
  path: 'docs',
}));
