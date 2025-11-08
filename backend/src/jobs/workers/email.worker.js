"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const redis_1 = require("../../plugins/redis");
const logger_1 = require("../logger");
const email_service_1 = require("../../services/email.service");
if (!redis_1.redis) {
    logger_1.logger.error('Redis connection not available for BullMQ Worker. Worker cannot start.');
    process.exit(1);
}
const emailService = new email_service_1.EmailService();
const worker = new bullmq_1.Worker('email-queue', async (job) => {
    if (job.name === 'send-welcome-email') {
        const { email, name } = job.data;
        logger_1.logger.info(`Processing welcome email for ${email}`);
        try {
            await emailService.sendUserRegistrationWelcome(email, name, email); // Using email as username for now
            logger_1.logger.info(`Welcome email sent to ${email}`);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger_1.logger.error({ err }, `Failed to send welcome email to ${email}`);
            throw err; // Throw error to trigger retry mechanism
        }
    }
}, { connection: redis_1.redis });
worker.on('completed', job => {
    logger_1.logger.info(`Job ${job.id} has completed!`);
});
worker.on('failed', (job, err) => {
    if (job) {
        logger_1.logger.error(`Job ${job.id} has failed with ${err.message}`);
    }
    else {
        logger_1.logger.error(`A job has failed with ${err.message}`);
    }
});
logger_1.logger.info('📧 Email worker started and listening for jobs...');
