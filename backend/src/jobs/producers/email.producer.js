"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSendWelcomeEmailJob = void 0;
const queues_1 = require("../queues");
const logger_1 = require("../logger");
const addSendWelcomeEmailJob = async (data) => {
    if (!queues_1.emailQueue) {
        logger_1.logger.error('Email queue is not available. Cannot add job.');
        // In a real app, you might want a fallback here, like sending the email synchronously.
        return;
    }
    try {
        await queues_1.emailQueue.add('send-welcome-email', data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
        });
        logger_1.logger.info(`Added welcome email job for ${data.email} to the queue.`);
    }
    catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger_1.logger.error({ err }, 'Failed to add welcome email job to queue');
    }
};
exports.addSendWelcomeEmailJob = addSendWelcomeEmailJob;
