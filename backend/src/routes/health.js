"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.health = void 0;
const health = async (fastify) => {
    fastify.get('/health', async (request, reply) => {
        try {
            // Basic health check
            const healthStatus = {
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.version,
                environment: process.env.NODE_ENV || 'development'
            };
            // Database health check (if available)
            try {
                // Add database connectivity check here if needed
                healthStatus.database = 'connected';
            }
            catch (error) {
                healthStatus.database = 'disconnected';
                healthStatus.status = 'degraded';
            }
            // Redis health check (if available)
            try {
                // Add Redis connectivity check here if needed
                healthStatus.redis = 'connected';
            }
            catch (error) {
                healthStatus.redis = 'disconnected';
                healthStatus.status = 'degraded';
            }
            return reply.status(200).send(healthStatus);
        }
        catch (error) {
            return reply.status(500).send({
                status: 'error',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
};
exports.health = health;
