import { Injectable, LoggerService } from '@nestjs/common';
import pino from 'pino';

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

@Injectable()
export class OmniLogger implements LoggerService {
  log(message: any, ...optionalParams: any[]) {
    pinoLogger.info({ context: optionalParams[0] }, message);
  }
  error(message: any, ...optionalParams: any[]) {
    pinoLogger.error({ context: optionalParams[0], trace: optionalParams[1] }, message);
  }
  warn(message: any, ...optionalParams: any[]) {
    pinoLogger.warn({ context: optionalParams[0] }, message);
  }
  debug(message: any, ...optionalParams: any[]) {
    pinoLogger.debug({ context: optionalParams[0] }, message);
  }
  verbose(message: any, ...optionalParams: any[]) {
    pinoLogger.trace({ context: optionalParams[0] }, message);
  }
}

export { pinoLogger };
