import { registerAs } from '@nestjs/config';
import { ValidationPipeOptions } from '@nestjs/common';

export default registerAs('validation', (): ValidationPipeOptions => ({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
}));
