"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../plugins/redis");
const logger_1 = require("./logger");
if (!redis_1.redis) {
    logger_1.logger.error('Redis connection not available for BullMQ. Job queue will not work.');
    // Depending on the application's needs, you might want to throw an error here
    // to prevent the application from starting without a functional job queue.
    // For now, we log the error and allow the app to continue, but jobs will fail.
}
// It's better to use a new Redis connection for BullMQ for blocking commands
// But for simplicity in this context, we reuse the existing one.
// The `redis` from the plugin might be null if the connection failed.
exports.emailQueue = redis_1.redis
    ? new bullmq_1.Queue('email-queue', { connection: redis_1.redis })
    : null;
if (exports.emailQueue) {
    logger_1.logger.info('📧 Email queue initialized successfully.');
}
else {
    logger_1.logger.warn('⚠️ Email queue could not be initialized because Redis is not available.');
}
