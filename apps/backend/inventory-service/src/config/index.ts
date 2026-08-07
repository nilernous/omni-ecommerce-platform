import appConfig from './app.config';
import databaseConfig from './database.config';
import rabbitmqConfig from './rabbitmq.config';
import redisConfig from './redis.config';
import validationConfig from './validation.config';

export { appConfig, databaseConfig, rabbitmqConfig, redisConfig, validationConfig };
export default [appConfig, databaseConfig, rabbitmqConfig, redisConfig, validationConfig];
