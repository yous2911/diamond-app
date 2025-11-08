export type LogPayload = any;

class SimpleLogger {
  info(message: string, payload?: LogPayload | unknown): void {
    if (payload) {
      console.log(message, payload);
    } else {
      console.log(message);
    }
  }

  warn(message: string, payload?: LogPayload | unknown): void {
    if (payload) {
      console.warn(message, payload);
    } else {
      console.warn(message);
    }
  }

  error(message: string, payload?: LogPayload | unknown): void {
    if (payload) {
      console.error(message, payload);
    } else {
      console.error(message);
    }
  }

  debug(message: string, payload?: LogPayload | unknown): void {
    if (payload) {
      console.debug(message, payload);
    } else {
      console.debug(message);
    }
  }
}

export const logger = new SimpleLogger();


