"use strict";
// GRACEFUL SHUTDOWN AND MONITORING SERVICE
// Production-ready process management and health monitoring
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGracefulShutdownService = exports.createGracefulShutdownService = exports.GracefulShutdownService = void 0;
const events_1 = require("events");
const logger_1 = require("../utils/logger");
const connection_1 = require("../db/connection");
class GracefulShutdownService extends events_1.EventEmitter {
    constructor(fastify) {
        super();
        this.shutdownHooks = [];
        this.healthChecks = [];
        this.isShuttingDown = false;
        // Performance monitoring
        this.startTime = Date.now();
        this.gcStats = { collections: 0, duration: 0 };
        this.fastify = fastify;
        this.setupDefaultHooks();
        this.setupDefaultHealthChecks();
        this.setupProcessListeners();
        this.setupPerformanceMonitoring();
    }
    /**
     * Add a shutdown hook
     */
    addShutdownHook(hook) {
        this.shutdownHooks.push(hook);
        // Sort by priority (lower number = higher priority)
        this.shutdownHooks.sort((a, b) => a.priority - b.priority);
        logger_1.logger.info('Shutdown hook registered', {
            name: hook.name,
            priority: hook.priority,
            timeout: hook.timeout
        });
    }
    /**
     * Add a health check
     */
    addHealthCheck(check) {
        this.healthChecks.push(check);
        logger_1.logger.info('Health check registered', {
            name: check.name,
            timeout: check.timeout,
            critical: check.critical
        });
    }
    /**
     * Start monitoring services
     */
    startMonitoring() {
        // Health check monitoring every 30 seconds
        this.healthCheckInterval = setInterval(async () => {
            await this.performHealthChecks();
        }, 30000);
        // Performance monitoring every 60 seconds
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
        }, 60000);
        // Emit initial health check
        setImmediate(() => this.performHealthChecks());
        logger_1.logger.info('Monitoring services started');
    }
    /**
     * Stop monitoring services
     */
    stopMonitoring() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = undefined;
        }
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
        if (this.eventLoopMonitor) {
            this.eventLoopMonitor.unref();
            this.eventLoopMonitor = undefined;
        }
        logger_1.logger.info('Monitoring services stopped');
    }
    /**
     * Perform health checks
     */
    async performHealthChecks() {
        const startTime = Date.now();
        const checks = {};
        let overallHealthy = true;
        let hasCriticalFailure = false;
        // Run all health checks concurrently
        const healthCheckPromises = this.healthChecks.map(async (check) => {
            const checkStartTime = Date.now();
            try {
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), check.timeout));
                const result = await Promise.race([
                    check.check(),
                    timeoutPromise
                ]);
                const responseTime = Date.now() - checkStartTime;
                checks[check.name] = {
                    healthy: result.healthy,
                    responseTime,
                    details: result.details
                };
                if (!result.healthy) {
                    overallHealthy = false;
                    if (check.critical) {
                        hasCriticalFailure = true;
                    }
                }
            }
            catch (error) {
                const responseTime = Date.now() - checkStartTime;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                checks[check.name] = {
                    healthy: false,
                    responseTime,
                    error: errorMessage
                };
                overallHealthy = false;
                if (check.critical) {
                    hasCriticalFailure = true;
                }
                logger_1.logger.warn('Health check failed', {
                    checkName: check.name,
                    error: errorMessage,
                    responseTime
                });
            }
        });
        await Promise.all(healthCheckPromises);
        // Determine overall status
        let status;
        if (hasCriticalFailure) {
            status = 'unhealthy';
        }
        else if (!overallHealthy) {
            status = 'degraded';
        }
        else {
            status = 'healthy';
        }
        const healthStatus = {
            status,
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.startTime,
            version: process.env.npm_package_version || '1.0.0',
            checks,
            metrics: this.collectMetrics()
        };
        this.lastHealthStatus = healthStatus;
        // Emit health status event
        this.emit('healthCheck', healthStatus);
        // Log status changes
        if (this.lastHealthStatus?.status !== status) {
            logger_1.logger.info('Health status changed', {
                previousStatus: this.lastHealthStatus?.status,
                newStatus: status,
                totalChecks: this.healthChecks.length,
                failedChecks: Object.values(checks).filter(c => !c.healthy).length
            });
        }
        return healthStatus;
    }
    /**
     * Get current health status
     */
    getHealthStatus() {
        return this.lastHealthStatus;
    }
    /**
     * Initiate graceful shutdown
     */
    async shutdown(signal = 'SIGTERM') {
        if (this.isShuttingDown) {
            logger_1.logger.warn('Shutdown already in progress, ignoring signal', { signal });
            return;
        }
        this.isShuttingDown = true;
        this.shutdownStartTime = Date.now();
        logger_1.logger.info('Graceful shutdown initiated', {
            signal,
            hooksCount: this.shutdownHooks.length
        });
        try {
            // Stop accepting new connections
            await this.fastify.close();
            // Execute shutdown hooks in priority order
            for (const hook of this.shutdownHooks) {
                await this.executeShutdownHook(hook);
            }
            // Stop monitoring
            this.stopMonitoring();
            const shutdownDuration = Date.now() - this.shutdownStartTime;
            logger_1.logger.info('Graceful shutdown completed successfully', {
                duration: shutdownDuration,
                signal
            });
            this.emit('shutdownComplete', { signal, duration: shutdownDuration });
        }
        catch (error) {
            const shutdownDuration = this.shutdownStartTime ? Date.now() - this.shutdownStartTime : 0;
            logger_1.logger.error('Graceful shutdown failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: shutdownDuration,
                signal
            });
            this.emit('shutdownError', { error, signal, duration: shutdownDuration });
            throw error;
        }
    }
    /**
     * Force shutdown after timeout
     */
    async executeShutdownHook(hook) {
        const startTime = Date.now();
        try {
            logger_1.logger.info('Executing shutdown hook', {
                name: hook.name,
                priority: hook.priority,
                timeout: hook.timeout
            });
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`Shutdown hook timeout: ${hook.name}`)), hook.timeout));
            await Promise.race([
                hook.handler(),
                timeoutPromise
            ]);
            const duration = Date.now() - startTime;
            logger_1.logger.info('Shutdown hook completed successfully', {
                name: hook.name,
                duration
            });
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger_1.logger.error('Shutdown hook failed', {
                name: hook.name,
                error: errorMessage,
                duration
            });
            // Continue with other hooks even if this one fails
        }
    }
    /**
     * Collect system metrics
     */
    collectMetrics() {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        return {
            uptime: Date.now() - this.startTime,
            memory: memoryUsage,
            cpu: {
                user: cpuUsage.user / 1000000, // Convert to seconds
                system: cpuUsage.system / 1000000
            },
            eventLoop: {
                delay: this.getEventLoopDelay(),
                utilization: this.getEventLoopUtilization()
            },
            handles: {
                active: process._getActiveHandles?.()?.length || 0,
                pending: process._getActiveRequests?.()?.length || 0
            },
            gc: this.gcStats
        };
    }
    /**
     * Setup default shutdown hooks
     */
    setupDefaultHooks() {
        // Database disconnection
        this.addShutdownHook({
            name: 'database',
            priority: 1,
            timeout: 10000,
            handler: async () => {
                logger_1.logger.info('Closing database connections...');
                await (0, connection_1.disconnectDatabase)();
            }
        });
        // Redis disconnection
        this.addShutdownHook({
            name: 'redis',
            priority: 2,
            timeout: 5000,
            handler: async () => {
                if (this.fastify.redis) {
                    logger_1.logger.info('Closing Redis connection...');
                    await this.fastify.redis.quit();
                }
            }
        });
        // Cache cleanup
        this.addShutdownHook({
            name: 'cache',
            priority: 3,
            timeout: 3000,
            handler: async () => {
                if (this.fastify.cache) {
                    logger_1.logger.info('Flushing cache...');
                    // Don't flush in production, just disconnect
                    // await this.fastify.cache.flush();
                }
            }
        });
        // Final cleanup
        this.addShutdownHook({
            name: 'cleanup',
            priority: 99,
            timeout: 2000,
            handler: async () => {
                logger_1.logger.info('Final cleanup...');
                // Any final cleanup tasks
            }
        });
    }
    /**
     * Setup default health checks
     */
    setupDefaultHealthChecks() {
        // Database health check
        this.addHealthCheck({
            name: 'database',
            timeout: 5000,
            critical: true,
            check: async () => {
                try {
                    const health = await this.fastify.dbHealth();
                    return {
                        healthy: health.status === 'healthy',
                        details: health.details
                    };
                }
                catch (error) {
                    return {
                        healthy: false,
                        details: { error: error instanceof Error ? error.message : 'Unknown error' }
                    };
                }
            }
        });
        // Redis health check
        this.addHealthCheck({
            name: 'redis',
            timeout: 3000,
            critical: false,
            check: async () => {
                try {
                    if (this.fastify.cache) {
                        const result = await this.fastify.cache.ping();
                        return {
                            healthy: result === 'PONG' || result === 'PONG (memory cache)',
                            details: { response: result }
                        };
                    }
                    return { healthy: true, details: { status: 'disabled' } };
                }
                catch (error) {
                    return {
                        healthy: false,
                        details: { error: error instanceof Error ? error.message : 'Unknown error' }
                    };
                }
            }
        });
        // Memory health check
        this.addHealthCheck({
            name: 'memory',
            timeout: 1000,
            critical: false,
            check: async () => {
                const memoryUsage = process.memoryUsage();
                const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
                const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
                const heapUtilization = (heapUsedMB / heapTotalMB) * 100;
                return {
                    healthy: heapUtilization < 90, // Alert if heap is over 90% utilized
                    details: {
                        heapUsedMB: Math.round(heapUsedMB),
                        heapTotalMB: Math.round(heapTotalMB),
                        heapUtilization: Math.round(heapUtilization)
                    }
                };
            }
        });
    }
    /**
     * Setup process listeners
     */
    setupProcessListeners() {
        const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
        signals.forEach(signal => {
            process.on(signal, async () => {
                logger_1.logger.info(`Received ${signal}, initiating graceful shutdown...`);
                try {
                    await this.shutdown(signal);
                    process.exit(0);
                }
                catch (error) {
                    logger_1.logger.error('Graceful shutdown failed, forcing exit', { error });
                    process.exit(1);
                }
            });
        });
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('Uncaught exception, initiating emergency shutdown', { error });
            this.shutdown('uncaughtException').finally(() => process.exit(1));
        });
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.logger.error('Unhandled promise rejection, initiating emergency shutdown', {
                reason,
                promise
            });
            this.shutdown('unhandledRejection').finally(() => process.exit(1));
        });
    }
    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor garbage collection if available
        try {
            const v8 = require('v8');
            if (v8.getHeapStatistics) {
                const originalGC = global.gc;
                if (originalGC) {
                    global.gc = () => {
                        const start = Date.now();
                        originalGC();
                        this.gcStats.collections++;
                        this.gcStats.duration += Date.now() - start;
                    };
                }
            }
        }
        catch (error) {
            // v8 module not available, skip GC monitoring
        }
        // Monitor event loop
        try {
            const { monitorEventLoopDelay } = require('perf_hooks');
            this.eventLoopMonitor = monitorEventLoopDelay({ resolution: 20 });
            this.eventLoopMonitor.enable();
        }
        catch (error) {
            // perf_hooks not available, skip event loop monitoring
        }
    }
    /**
     * Get event loop delay
     */
    getEventLoopDelay() {
        if (this.eventLoopMonitor) {
            return this.eventLoopMonitor.mean / 1000000; // Convert to milliseconds
        }
        return 0;
    }
    /**
     * Get event loop utilization
     */
    getEventLoopUtilization() {
        try {
            const { performance } = require('perf_hooks');
            if (performance.eventLoopUtilization) {
                const utilization = performance.eventLoopUtilization();
                return (utilization.active / (utilization.active + utilization.idle)) * 100;
            }
        }
        catch (error) {
            // Not available
        }
        return 0;
    }
}
exports.GracefulShutdownService = GracefulShutdownService;
// Export singleton pattern for easy usage
let gracefulShutdownInstance;
function createGracefulShutdownService(fastify) {
    if (!gracefulShutdownInstance) {
        gracefulShutdownInstance = new GracefulShutdownService(fastify);
    }
    return gracefulShutdownInstance;
}
exports.createGracefulShutdownService = createGracefulShutdownService;
function getGracefulShutdownService() {
    return gracefulShutdownInstance;
}
exports.getGracefulShutdownService = getGracefulShutdownService;
