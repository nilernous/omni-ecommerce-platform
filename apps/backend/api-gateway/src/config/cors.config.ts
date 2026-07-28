import { registerAs } from '@nestjs/config';

export default registerAs('cors', () => ({
  enabled: process.env.CORS_ENABLED !== 'false',
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
  credentials: process.env.CORS_CREDENTIALS === 'true',
}));
