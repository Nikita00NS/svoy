import { LoggerService } from '@nestjs/common';

export class AppLogger implements LoggerService {
  log(message: any, context?: string) {
    console.log(JSON.stringify({ level: 'log', message, context, time: new Date().toISOString() }));
  }
  error(message: any, trace?: string, context?: string) {
    console.error(JSON.stringify({ level: 'error', message, trace, context, time: new Date().toISOString() }));
  }
  warn(message: any, context?: string) {
    console.warn(JSON.stringify({ level: 'warn', message, context, time: new Date().toISOString() }));
  }
  debug(message: any, context?: string) {
    console.debug(JSON.stringify({ level: 'debug', message, context, time: new Date().toISOString() }));
  }
  verbose(message: any, context?: string) {
    console.info(JSON.stringify({ level: 'verbose', message, context, time: new Date().toISOString() }));
  }
}
