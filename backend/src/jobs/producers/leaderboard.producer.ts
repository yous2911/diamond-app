import { leaderboardQueue } from '../queues';
import { logger } from '../logger';

/**
 * Add a leaderboard update job to the queue
 * Returns the job object with id for tracking
 */
export const addLeaderboardUpdateJob = async () => {
  if (!leaderboardQueue) {
    logger.warn('Leaderboard queue is not available. Cannot add job.');
    return null;
  }

  try {
    const job = await leaderboardQueue.add('update-leaderboards', {
      timestamp: new Date().toISOString()
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    logger.info(`Added leaderboard update job to the queue. Job ID: ${job.id}`);
    return job;
  } catch (error: unknown) {
    logger.error('Failed to add leaderboard update job to queue', { err: error });
    return null;
  }
};

/**
 * Schedule a recurring leaderboard update job
 * Runs every 5 minutes in production
 */
export const scheduleRecurringLeaderboardUpdate = () => {
  if (!leaderboardQueue) {
    logger.warn('Leaderboard queue is not available. Cannot schedule recurring job.');
    return;
  }

  try {
    // Add a repeatable job that runs every 5 minutes
    leaderboardQueue.add('update-leaderboards', {
      timestamp: new Date().toISOString()
    }, {
      repeat: {
        pattern: '*/5 * * * *', // Every 5 minutes
      },
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    logger.info('🏆 Scheduled recurring leaderboard update job (every 5 minutes)');
  } catch (error: unknown) {
    logger.error('Failed to schedule recurring leaderboard update', { err: error });
  }
};
