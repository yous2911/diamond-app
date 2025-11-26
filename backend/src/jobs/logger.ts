import pino from 'pino';

const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  } : undefined,
});

// Typed wrapper to fix TypeScript strict mode issues
export const logger = {
  info: (msgOrObj: string | Record<string, any>, obj?: Record<string, any>) => {
    if (typeof msgOrObj === 'string') {
      baseLogger.info(obj || {}, msgOrObj);
    } else {
      baseLogger.info(msgOrObj);
    }
  },

  warn: (msgOrObj: string | Record<string, any>, obj?: Record<string, any>) => {
    if (typeof msgOrObj === 'string') {
      baseLogger.warn(obj || {}, msgOrObj);
    } else {
      baseLogger.warn(msgOrObj);
    }
  },

  error: (msgOrObj: string | Record<string, any> | Error, obj?: Record<string, any>) => {
    if (msgOrObj instanceof Error) {
      baseLogger.error(msgOrObj);
    } else if (typeof msgOrObj === 'string') {
      baseLogger.error(obj || {}, msgOrObj);
    } else {
      baseLogger.error(msgOrObj);
    }
  },

  debug: (msgOrObj: string | Record<string, any>, obj?: Record<string, any>) => {
    if (typeof msgOrObj === 'string') {
      baseLogger.debug(obj || {}, msgOrObj);
    } else {
      baseLogger.debug(msgOrObj);
    }
  },

  fatal: (msgOrObj: string | Record<string, any>, obj?: Record<string, any>) => {
    if (typeof msgOrObj === 'string') {
      baseLogger.fatal(obj || {}, msgOrObj);
    } else {
      baseLogger.fatal(msgOrObj);
    }
  },

  trace: (msgOrObj: string | Record<string, any>, obj?: Record<string, any>) => {
    if (typeof msgOrObj === 'string') {
      baseLogger.trace(obj || {}, msgOrObj);
    } else {
      baseLogger.trace(msgOrObj);
    }
  },

  // Child logger creation
  child: (bindings: Record<string, any>) => baseLogger.child(bindings),

  // Direct access to base logger if needed
  base: baseLogger
};
