import { Worker } from 'bullmq';
import { redis } from '../../plugins/redis';
import { logger } from '../logger';
import { EmailService } from '../../services/email.service';

if (!redis) {
  logger.error('Redis connection not available for BullMQ Worker. Worker cannot start.');
  process.exit(1);
}

const emailService = new EmailService();

const worker = new Worker('email-queue', async job => {
  if (job.name === 'send-welcome-email') {
    const { email, name } = job.data;
    logger.info(`Processing welcome email for ${email}`);
    try {
      await emailService.sendUserRegistrationWelcome(email, name, email); // Using email as username for now
      logger.info(`Welcome email sent to ${email}`);
    } catch (error: unknown) {
      logger.error(`Failed to send welcome email to ${email}`, { err: error });
      throw error; // Throw error to trigger retry mechanism
    }
  }
}, { connection: redis });

worker.on('completed', job => {
  logger.info(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  if (job) {
    logger.error(`Job ${job.id} has failed with ${err.message}`);
  } else {
    logger.error(`A job has failed with ${err.message}`);
  }
});

logger.info('📧 Email worker started and listening for jobs...');
