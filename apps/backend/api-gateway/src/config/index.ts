import appConfig from './app.config';
import authConfig from './auth.config';
import corsConfig from './cors.config';
import rabbitmqConfig from './rabbitmq.config';
import redisConfig from './redis.config';
import swaggerConfig from './swagger.config';
import throttlerConfig from './throttler.config';
import validationConfig from './validation.config';

export {
  appConfig,
  authConfig,
  corsConfig,
  rabbitmqConfig,
  redisConfig,
  swaggerConfig,
  throttlerConfig,
  validationConfig,
};

export const configs = [
  appConfig,
  authConfig,
  corsConfig,
  rabbitmqConfig,
  redisConfig,
  swaggerConfig,
  throttlerConfig,
  validationConfig,
];
