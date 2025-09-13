import { Queue } from 'bullmq';
import { redis } from '../plugins/redis';
import { logger } from './logger';

if (!redis) {
  logger.error('Redis connection not available for BullMQ. Job queue will not work.');
  // Depending on the application's needs, you might want to throw an error here
  // to prevent the application from starting without a functional job queue.
  // For now, we log the error and allow the app to continue, but jobs will fail.
}

// It's better to use a new Redis connection for BullMQ for blocking commands
// But for simplicity in this context, we reuse the existing one.
// The `redis` from the plugin might be null if the connection failed.
export const emailQueue = redis
  ? new Queue('email-queue', { connection: redis })
  : null;

if (emailQueue) {
  logger.info('📧 Email queue initialized successfully.');
} else {
  logger.warn('⚠️ Email queue could not be initialized because Redis is not available.');
}
