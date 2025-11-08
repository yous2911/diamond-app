"use strict";
/**
 * Database Connection Resilience Service for RevEd Kids
 * Provides advanced connection timeout handling, retry logic, and connection recovery
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionResilienceService = void 0;
const connection_1 = require("../db/connection");
const logger_1 = require("../utils/logger");
const events_1 = require("events");
class ConnectionResilienceService extends events_1.EventEmitter {
    constructor() {
        super();
        this.circuitBreakerState = 'closed';
        this.failureCount = 0;
        this.lastFailureTime = 0;
        this.resetTimer = null;
        this.healthCheckInterval = null;
        this.consecutiveHealthFailures = 0;
        this.isHealthy = true;
        this.metrics = [];
        this.activeOperations = new Map();
        this.responseTimes = [];
        this.connectionErrors = 0;
        this.timeoutErrors = 0;
        this.config = {
            timeouts: {
                connection: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'), // 30s
                query: parseInt(process.env.DB_QUERY_TIMEOUT || '60000'), // 60s
                idle: parseInt(process.env.DB_IDLE_TIMEOUT || '300000'), // 5min
                acquire: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'), // 60s
            },
            retryPolicy: {
                maxRetries: parseInt(process.env.DB_MAX_RETRIES || '3'),
                baseDelay: parseInt(process.env.DB_BASE_DELAY || '1000'), // 1s
                maxDelay: parseInt(process.env.DB_MAX_DELAY || '30000'), // 30s
                backoffMultiplier: parseFloat(process.env.DB_BACKOFF_MULTIPLIER || '2'),
                jitter: process.env.DB_RETRY_JITTER !== 'false'
            },
            circuitBreaker: {
                enabled: process.env.DB_CIRCUIT_BREAKER_ENABLED !== 'false',
                failureThreshold: parseInt(process.env.DB_CIRCUIT_BREAKER_THRESHOLD || '5'),
                resetTimeout: parseInt(process.env.DB_CIRCUIT_BREAKER_RESET_TIMEOUT || '60000'), // 1min
                monitoringWindow: parseInt(process.env.DB_CIRCUIT_BREAKER_WINDOW || '60000') // 1min
            },
            healthCheck: {
                enabled: process.env.DB_HEALTH_CHECK_ENABLED !== 'false',
                interval: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '30000'), // 30s
                timeout: parseInt(process.env.DB_HEALTH_CHECK_TIMEOUT || '5000'), // 5s
                failureThreshold: parseInt(process.env.DB_HEALTH_CHECK_FAILURE_THRESHOLD || '3')
            },
            recovery: {
                enabled: process.env.DB_RECOVERY_ENABLED !== 'false',
                maxRecoveryAttempts: parseInt(process.env.DB_MAX_RECOVERY_ATTEMPTS || '5'),
                recoveryBackoffMs: parseInt(process.env.DB_RECOVERY_BACKOFF || '5000'), // 5s
                warmupQueries: [
                    'SELECT 1 as warmup_test',
                    'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()'
                ]
            }
        };
    }
    async initialize() {
        try {
            logger_1.logger.info('Initializing connection resilience service...', {
                circuitBreakerEnabled: this.config.circuitBreaker.enabled,
                healthCheckEnabled: this.config.healthCheck.enabled,
                maxRetries: this.config.retryPolicy.maxRetries
            });
            // Setup health monitoring
            if (this.config.healthCheck.enabled) {
                this.setupHealthCheck();
            }
            // Setup metrics collection
            this.setupMetricsCollection();
            logger_1.logger.info('Connection resilience service initialized successfully');
            this.emit('initialized');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize connection resilience service', { error });
            throw error;
        }
    }
    setupHealthCheck() {
        this.healthCheckInterval = setInterval(async () => {
            try {
                await this.performHealthCheck();
            }
            catch (error) {
                logger_1.logger.debug('Health check interval error', { error });
            }
        }, this.config.healthCheck.interval);
        logger_1.logger.info('Database health monitoring started', {
            interval: this.config.healthCheck.interval,
            timeout: this.config.healthCheck.timeout
        });
    }
    setupMetricsCollection() {
        // Collect metrics every minute
        setInterval(() => {
            this.collectMetrics();
        }, 60000);
    }
    async performHealthCheck() {
        const startTime = Date.now();
        try {
            // Use the existing testConnection with timeout
            const healthCheckPromise = (0, connection_1.testConnection)(1);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Health check timeout')), this.config.healthCheck.timeout);
            });
            const isHealthy = await Promise.race([healthCheckPromise, timeoutPromise]);
            const responseTime = Date.now() - startTime;
            if (isHealthy) {
                this.recordSuccessfulHealthCheck(responseTime);
            }
            else {
                this.recordFailedHealthCheck(new Error('Health check returned false'));
            }
        }
        catch (error) {
            this.recordFailedHealthCheck(error);
        }
    }
    recordSuccessfulHealthCheck(responseTime) {
        this.consecutiveHealthFailures = 0;
        if (!this.isHealthy) {
            this.isHealthy = true;
            logger_1.logger.info('Database health restored');
            this.emit('healthRestored');
        }
        // Update response time tracking
        this.responseTimes.push(responseTime);
        if (this.responseTimes.length > 100) {
            this.responseTimes = this.responseTimes.slice(-50); // Keep last 50
        }
        // Reset circuit breaker on successful health check if applicable
        if (this.circuitBreakerState === 'half-open') {
            this.circuitBreakerState = 'closed';
            this.failureCount = 0;
            logger_1.logger.info('Circuit breaker closed - service recovered');
            this.emit('circuitBreakerClosed');
        }
    }
    recordFailedHealthCheck(error) {
        this.consecutiveHealthFailures++;
        if (this.isHealthy && this.consecutiveHealthFailures >= this.config.healthCheck.failureThreshold) {
            this.isHealthy = false;
            logger_1.logger.error('Database marked as unhealthy', {
                consecutiveFailures: this.consecutiveHealthFailures,
                threshold: this.config.healthCheck.failureThreshold,
                error: error.message
            });
            this.emit('healthDegraded', error);
        }
        // Update circuit breaker
        this.recordFailure();
    }
    recordFailure() {
        if (!this.config.circuitBreaker.enabled)
            return;
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.circuitBreakerState === 'closed' &&
            this.failureCount >= this.config.circuitBreaker.failureThreshold) {
            this.circuitBreakerState = 'open';
            logger_1.logger.error('Circuit breaker opened', {
                failureCount: this.failureCount,
                threshold: this.config.circuitBreaker.failureThreshold
            });
            this.emit('circuitBreakerOpened');
            this.scheduleCircuitBreakerReset();
        }
    }
    scheduleCircuitBreakerReset() {
        if (this.resetTimer) {
            clearTimeout(this.resetTimer);
        }
        this.resetTimer = setTimeout(() => {
            if (this.circuitBreakerState === 'open') {
                this.circuitBreakerState = 'half-open';
                logger_1.logger.info('Circuit breaker half-opened - testing service');
                this.emit('circuitBreakerHalfOpened');
            }
        }, this.config.circuitBreaker.resetTimeout);
    }
    async executeWithRetry(operation, options = {}) {
        // Check circuit breaker
        if (this.config.circuitBreaker.enabled && this.circuitBreakerState === 'open') {
            throw new Error('Circuit breaker is open - service unavailable');
        }
        const operationId = this.generateOperationId();
        const maxRetries = options.maxRetries ?? this.config.retryPolicy.maxRetries;
        const timeout = options.timeout ?? this.config.timeouts.query;
        const retryOperation = {
            id: operationId,
            operation,
            attempts: 0,
            maxAttempts: maxRetries + 1, // +1 for initial attempt
            startTime: new Date(),
            delays: []
        };
        this.activeOperations.set(operationId, retryOperation);
        try {
            const result = await this.executeOperationWithRetries(retryOperation, options, timeout);
            // Record success
            this.recordOperationSuccess(Date.now() - retryOperation.startTime.getTime());
            return result;
        }
        catch (error) {
            // Record failure
            this.recordOperationFailure(error);
            throw error;
        }
        finally {
            this.activeOperations.delete(operationId);
        }
    }
    async executeOperationWithRetries(retryOperation, options, timeout) {
        while (retryOperation.attempts < retryOperation.maxAttempts) {
            try {
                retryOperation.attempts++;
                // Create timeout promise
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        reject(new Error(`Operation timeout after ${timeout}ms`));
                    }, timeout);
                });
                // Execute operation with timeout
                const result = await Promise.race([
                    retryOperation.operation(),
                    timeoutPromise
                ]);
                // Success - reset circuit breaker failure count if in half-open state
                if (this.circuitBreakerState === 'half-open') {
                    this.circuitBreakerState = 'closed';
                    this.failureCount = 0;
                    logger_1.logger.info('Circuit breaker closed after successful operation');
                    this.emit('circuitBreakerClosed');
                }
                return result;
            }
            catch (error) {
                retryOperation.lastError = error;
                // Check if error is timeout
                if (error.message.includes('timeout')) {
                    this.timeoutErrors++;
                }
                else {
                    this.connectionErrors++;
                }
                // Check if we should retry
                if (!this.shouldRetry(error, retryOperation, options.customRetryCondition)) {
                    throw error;
                }
                // Calculate delay for next retry
                if (retryOperation.attempts < retryOperation.maxAttempts) {
                    const delay = this.calculateRetryDelay(retryOperation.attempts - 1);
                    retryOperation.delays.push(delay);
                    logger_1.logger.warn('Operation failed, retrying...', {
                        operationId: retryOperation.id,
                        attempt: retryOperation.attempts,
                        maxAttempts: retryOperation.maxAttempts,
                        error: error.message,
                        retryDelay: delay
                    });
                    await this.delay(delay);
                }
            }
        }
        // All retries exhausted
        const error = retryOperation.lastError || new Error('Max retries exceeded');
        logger_1.logger.error('Operation failed after all retries', {
            operationId: retryOperation.id,
            attempts: retryOperation.attempts,
            totalTime: Date.now() - retryOperation.startTime.getTime(),
            delays: retryOperation.delays,
            finalError: error.message
        });
        throw error;
    }
    shouldRetry(error, retryOperation, customRetryCondition) {
        // Don't retry if max attempts reached
        if (retryOperation.attempts >= retryOperation.maxAttempts) {
            return false;
        }
        // Use custom retry condition if provided
        if (customRetryCondition) {
            return customRetryCondition(error);
        }
        // Default retry conditions
        const retryableErrors = [
            'ECONNREFUSED',
            'ENOTFOUND',
            'ETIMEDOUT',
            'ECONNRESET',
            'EPIPE',
            'timeout',
            'Connection lost',
            'Connection refused'
        ];
        const errorMessage = error.message || error.code || '';
        return retryableErrors.some(retryableError => errorMessage.toLowerCase().includes(retryableError.toLowerCase()));
    }
    calculateRetryDelay(attemptNumber) {
        let delay = this.config.retryPolicy.baseDelay *
            Math.pow(this.config.retryPolicy.backoffMultiplier, attemptNumber);
        // Apply maximum delay cap
        delay = Math.min(delay, this.config.retryPolicy.maxDelay);
        // Add jitter if enabled
        if (this.config.retryPolicy.jitter) {
            const jitter = Math.random() * 0.1 * delay; // 10% jitter
            delay = delay + (Math.random() > 0.5 ? jitter : -jitter);
        }
        return Math.max(delay, 0);
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    recordOperationSuccess(duration) {
        this.responseTimes.push(duration);
        if (this.responseTimes.length > 100) {
            this.responseTimes = this.responseTimes.slice(-50);
        }
    }
    recordOperationFailure(error) {
        this.recordFailure();
        if (error.message.includes('timeout')) {
            this.timeoutErrors++;
        }
        else {
            this.connectionErrors++;
        }
    }
    collectMetrics() {
        const poolStats = (0, connection_1.getPoolStats)();
        const now = Date.now();
        // Calculate average response time
        const avgResponseTime = this.responseTimes.length > 0
            ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
            : 0;
        // Determine health status
        let healthStatus = 'healthy';
        if (!this.isHealthy) {
            healthStatus = 'unhealthy';
        }
        else if (this.circuitBreakerState !== 'closed' || avgResponseTime > 5000) {
            healthStatus = 'degraded';
        }
        const metrics = {
            timestamp: new Date(),
            totalConnections: poolStats.totalConnections,
            activeConnections: poolStats.activeConnections,
            idleConnections: poolStats.idleConnections,
            queuedRequests: poolStats.queuedRequests,
            failedConnections: this.failureCount,
            successfulRetries: 0, // Would need to track this separately
            circuitBreakerState: this.circuitBreakerState,
            healthStatus,
            avgResponseTime,
            connectionErrors: this.connectionErrors,
            timeoutErrors: this.timeoutErrors
        };
        this.metrics.push(metrics);
        // Keep only last 24 hours of metrics
        const cutoff = new Date(now - 24 * 60 * 60 * 1000);
        this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
        // Reset error counters periodically
        if (this.metrics.length % 60 === 0) { // Every hour (assuming 1-minute intervals)
            this.connectionErrors = Math.max(0, this.connectionErrors - 1);
            this.timeoutErrors = Math.max(0, this.timeoutErrors - 1);
        }
        this.emit('metricsCollected', metrics);
    }
    generateOperationId() {
        return `op-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    }
    // Recovery methods
    async attemptConnectionRecovery() {
        if (!this.config.recovery.enabled) {
            return false;
        }
        logger_1.logger.info('Attempting connection recovery...');
        for (let attempt = 1; attempt <= this.config.recovery.maxRecoveryAttempts; attempt++) {
            try {
                logger_1.logger.info('Recovery attempt', { attempt });
                // Try to reconnect
                const reconnected = await (0, connection_1.reconnectDatabase)();
                if (reconnected) {
                    // Run warmup queries
                    await this.runWarmupQueries();
                    logger_1.logger.info('Connection recovery successful');
                    this.emit('connectionRecovered');
                    return true;
                }
            }
            catch (error) {
                logger_1.logger.warn('Recovery attempt failed', {
                    attempt,
                    error: error.message
                });
            }
            if (attempt < this.config.recovery.maxRecoveryAttempts) {
                await this.delay(this.config.recovery.recoveryBackoffMs);
            }
        }
        logger_1.logger.error('Connection recovery failed after all attempts');
        return false;
    }
    async runWarmupQueries() {
        for (const query of this.config.recovery.warmupQueries) {
            try {
                await connection_1.connection.execute(query);
                logger_1.logger.debug('Warmup query successful', { query });
            }
            catch (error) {
                logger_1.logger.warn('Warmup query failed', { query, error: error.message });
            }
        }
    }
    // Public API methods
    getConnectionStatus() {
        const avgResponseTime = this.responseTimes.length > 0
            ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
            : 0;
        return {
            isHealthy: this.isHealthy,
            circuitBreakerState: this.circuitBreakerState,
            consecutiveFailures: this.consecutiveHealthFailures,
            avgResponseTime,
            activeOperations: this.activeOperations.size
        };
    }
    getMetrics() {
        return [...this.metrics];
    }
    getLatestMetrics() {
        return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
    }
    forceCircuitBreakerOpen() {
        this.circuitBreakerState = 'open';
        this.emit('circuitBreakerOpened');
        this.scheduleCircuitBreakerReset();
        logger_1.logger.warn('Circuit breaker manually opened');
    }
    forceCircuitBreakerClose() {
        this.circuitBreakerState = 'closed';
        this.failureCount = 0;
        if (this.resetTimer) {
            clearTimeout(this.resetTimer);
            this.resetTimer = null;
        }
        this.emit('circuitBreakerClosed');
        logger_1.logger.info('Circuit breaker manually closed');
    }
    async shutdown() {
        logger_1.logger.info('Shutting down connection resilience service...');
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        if (this.resetTimer) {
            clearTimeout(this.resetTimer);
            this.resetTimer = null;
        }
        // Cancel active operations
        for (const [operationId, operation] of this.activeOperations.entries()) {
            logger_1.logger.debug('Cancelling active operation', { operationId });
        }
        this.activeOperations.clear();
        logger_1.logger.info('Connection resilience service shutdown completed');
    }
}
// Create and export singleton instance
exports.connectionResilienceService = new ConnectionResilienceService();
exports.default = exports.connectionResilienceService;
