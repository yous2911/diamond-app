import { emailQueue } from '../queues';
import { logger } from '../logger';

interface WelcomeEmailJobData {
  email: string;
  name: string;
}

export const addSendWelcomeEmailJob = async (data: WelcomeEmailJobData) => {
  if (!emailQueue) {
    logger.error('Email queue is not available. Cannot add job.');
    // In a real app, you might want a fallback here, like sending the email synchronously.
    return;
  }

  try {
    await emailQueue.add('send-welcome-email', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
    logger.info(`Added welcome email job for ${data.email} to the queue.`);
  } catch (error) {
    logger.error('Failed to add welcome email job to queue:', error);
  }
};
