"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventLoopLag = exports.cpuUsage = exports.memoryUsage = exports.kioskModeSessions = exports.activeUsers = exports.lessonCompletions = exports.userRegistrations = exports.redisOperationsTotal = exports.redisOperationDuration = exports.dbConnectionsTotal = exports.dbConnectionsActive = exports.dbQueryDuration = exports.httpRequestInProgress = exports.httpRequestTotal = exports.httpRequestDuration = exports.measureAsync = exports.observeCustomHistogram = exports.setCustomGauge = exports.incrementCustomCounter = exports.getCustomMetric = exports.recordDatabaseConnectionTotal = exports.recordDatabaseConnection = exports.recordKioskModeSession = exports.recordActiveUser = exports.recordLessonCompletion = exports.recordUserRegistration = exports.recordRedisOperation = exports.recordDatabaseQuery = exports.initializeMonitoring = void 0;
const prometheus = __importStar(require("prom-client"));
const logger_1 = require("../jobs/logger");
// Prometheus metrics
const register = prometheus.register;
// HTTP metrics
const httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});
exports.httpRequestDuration = httpRequestDuration;
const httpRequestTotal = new prometheus.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
});
exports.httpRequestTotal = httpRequestTotal;
const httpRequestInProgress = new prometheus.Gauge({
    name: 'http_requests_in_progress',
    help: 'Number of HTTP requests currently in progress',
    labelNames: ['method', 'route'],
});
exports.httpRequestInProgress = httpRequestInProgress;
// Database metrics
const dbQueryDuration = new prometheus.Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['operation', 'table'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});
exports.dbQueryDuration = dbQueryDuration;
const dbConnectionsActive = new prometheus.Gauge({
    name: 'db_connections_active',
    help: 'Number of active database connections',
});
exports.dbConnectionsActive = dbConnectionsActive;
const dbConnectionsTotal = new prometheus.Counter({
    name: 'db_connections_total',
    help: 'Total number of database connections',
});
exports.dbConnectionsTotal = dbConnectionsTotal;
// Redis metrics
const redisOperationDuration = new prometheus.Histogram({
    name: 'redis_operation_duration_seconds',
    help: 'Duration of Redis operations in seconds',
    labelNames: ['operation'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
});
exports.redisOperationDuration = redisOperationDuration;
const redisOperationsTotal = new prometheus.Counter({
    name: 'redis_operations_total',
    help: 'Total number of Redis operations',
    labelNames: ['operation', 'status'],
});
exports.redisOperationsTotal = redisOperationsTotal;
// Business metrics
const userRegistrations = new prometheus.Counter({
    name: 'user_registrations_total',
    help: 'Total number of user registrations',
});
exports.userRegistrations = userRegistrations;
const lessonCompletions = new prometheus.Counter({
    name: 'lesson_completions_total',
    help: 'Total number of lesson completions',
    labelNames: ['lesson_type', 'difficulty'],
});
exports.lessonCompletions = lessonCompletions;
const activeUsers = new prometheus.Gauge({
    name: 'active_users_current',
    help: 'Current number of active users',
});
exports.activeUsers = activeUsers;
const kioskModeSessions = new prometheus.Counter({
    name: 'kiosk_mode_sessions_total',
    help: 'Total number of kiosk mode sessions',
    labelNames: ['duration_range'],
});
exports.kioskModeSessions = kioskModeSessions;
// System metrics
const memoryUsage = new prometheus.Gauge({
    name: 'nodejs_memory_usage_bytes',
    help: 'Node.js memory usage in bytes',
    labelNames: ['type'],
});
exports.memoryUsage = memoryUsage;
const cpuUsage = new prometheus.Gauge({
    name: 'nodejs_cpu_usage_percent',
    help: 'Node.js CPU usage percentage',
});
exports.cpuUsage = cpuUsage;
const eventLoopLag = new prometheus.Histogram({
    name: 'nodejs_eventloop_lag_seconds',
    help: 'Event loop lag in seconds',
    buckets: [0.001, 0.01, 0.1, 1, 10],
});
exports.eventLoopLag = eventLoopLag;
// Custom metrics
const customMetrics = new Map();
// Initialize monitoring
const initializeMonitoring = (app) => {
    // Register metrics endpoint
    app.get('/metrics', async (request, reply) => {
        try {
            reply.header('Content-Type', register.contentType);
            return await register.metrics();
        }
        catch (error) {
            logger_1.logger.error('Error generating metrics', { error });
            return reply.status(500).send({ error: 'Failed to generate metrics' });
        }
    });
    // Register health check endpoint
    app.get('/health', async (request, reply) => {
        try {
            const health = await performHealthCheck();
            const statusCode = health.status === 'healthy' ? 200 : 503;
            // Add frontend information
            const enhancedHealth = {
                ...health,
                frontends: {
                    'CM1/CM2': 'http://localhost:3000',
                    'CP/CE1/CE2': 'http://localhost:3001'
                },
                version: '2.0.0',
                environment: process.env.NODE_ENV || 'development'
            };
            reply.status(statusCode).send(enhancedHealth);
        }
        catch (error) {
            logger_1.logger.error('Health check failed', { error });
            reply.status(503).send({
                status: 'unhealthy',
                error: 'Health check failed',
                timestamp: new Date().toISOString(),
                frontends: {
                    'CM1/CM2': 'http://localhost:3000',
                    'CP/CE1/CE2': 'http://localhost:3001'
                }
            });
        }
    });
    // Register detailed health check
    app.get('/health/detailed', async (request, reply) => {
        try {
            const health = await performDetailedHealthCheck();
            const statusCode = health.status === 'healthy' ? 200 : 503;
            reply.status(statusCode).send(health);
        }
        catch (error) {
            logger_1.logger.error('Detailed health check failed', { error });
            reply.status(503).send({
                status: 'unhealthy',
                error: 'Detailed health check failed',
                timestamp: new Date().toISOString(),
            });
        }
    });
    // Register readiness check
    app.get('/ready', async (request, reply) => {
        try {
            const readiness = await performReadinessCheck();
            const statusCode = readiness.ready ? 200 : 503;
            reply.status(statusCode).send(readiness);
        }
        catch (error) {
            logger_1.logger.error('Readiness check failed', { error });
            reply.status(503).send({
                ready: false,
                error: 'Readiness check failed',
                timestamp: new Date().toISOString(),
            });
        }
    });
    // Setup request monitoring
    setupRequestMonitoring(app);
    // Setup system monitoring
    setupSystemMonitoring();
    // Setup custom metrics
    setupCustomMetrics();
    logger_1.logger.info('Monitoring initialized successfully');
};
exports.initializeMonitoring = initializeMonitoring;
// Setup request monitoring
const setupRequestMonitoring = (app) => {
    app.addHook('onRequest', async (request) => {
        const startTime = Date.now();
        // Track request in progress
        httpRequestInProgress.inc({ method: request.method, route: request.routeOptions?.url || request.url || 'unknown' });
        // Store start time for duration calculation
        request.startTime = startTime;
    });
    app.addHook('onResponse', async (request, reply) => {
        const startTime = request.startTime;
        const duration = (Date.now() - startTime) / 1000;
        const route = request.routeOptions?.url || request.url || 'unknown';
        // Record metrics
        httpRequestDuration.observe({ method: request.method, route, status_code: reply.statusCode }, duration);
        httpRequestTotal.inc({
            method: request.method,
            route,
            status_code: reply.statusCode,
        });
        httpRequestInProgress.dec({ method: request.method, route });
        // Log slow requests
        if (duration > 5) {
            logger_1.logger.warn('Slow request detected', {
                method: request.method,
                route,
                duration,
                statusCode: reply.statusCode,
                userAgent: request.headers['user-agent'],
                ip: request.ip,
            });
        }
    });
};
// Setup system monitoring
const setupSystemMonitoring = () => {
    // Monitor memory usage
    setInterval(() => {
        const memUsage = process.memoryUsage();
        memoryUsage.set({ type: 'rss' }, memUsage.rss);
        memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
        memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
        memoryUsage.set({ type: 'external' }, memUsage.external);
    }, 30000);
    // Monitor CPU usage
    let lastCpuUsage = process.cpuUsage();
    let lastHrTime = process.hrtime();
    setInterval(() => {
        const currentCpuUsage = process.cpuUsage();
        const currentHrTime = process.hrtime();
        const elapsedUser = currentCpuUsage.user - lastCpuUsage.user;
        const elapsedSystem = currentCpuUsage.system - lastCpuUsage.system;
        const elapsedTime = (currentHrTime[0] - lastHrTime[0]) * 1000 + (currentHrTime[1] - lastHrTime[1]) / 1000000;
        const cpuPercent = ((elapsedUser + elapsedSystem) / elapsedTime) * 100;
        cpuUsage.set(cpuPercent);
        lastCpuUsage = currentCpuUsage;
        lastHrTime = currentHrTime;
    }, 30000);
    // Monitor event loop lag
    setInterval(() => {
        const start = process.hrtime();
        setImmediate(() => {
            const diff = process.hrtime(start);
            const lag = (diff[0] * 1000) + (diff[1] / 1000000);
            eventLoopLag.observe(lag);
        });
    }, 1000);
};
// Setup custom metrics
const setupCustomMetrics = () => {
    // Create custom counter
    const createCustomCounter = (name, help, labelNames = []) => {
        const counter = new prometheus.Counter({
            name: `custom_${name}`,
            help,
            labelNames,
        });
        customMetrics.set(name, counter);
        return counter;
    };
    // Create custom gauge
    const createCustomGauge = (name, help, labelNames = []) => {
        const gauge = new prometheus.Gauge({
            name: `custom_${name}`,
            help,
            labelNames,
        });
        customMetrics.set(name, gauge);
        return gauge;
    };
    // Create custom histogram
    const createCustomHistogram = (name, help, labelNames = [], buckets = []) => {
        const histogram = new prometheus.Histogram({
            name: `custom_${name}`,
            help,
            labelNames,
            buckets: buckets.length > 0 ? buckets : undefined,
        });
        customMetrics.set(name, histogram);
        return histogram;
    };
    // Export functions for use in other modules
    global.createCustomCounter = createCustomCounter;
    global.createCustomGauge = createCustomGauge;
    global.createCustomHistogram = createCustomHistogram;
};
// Perform health check
const performHealthCheck = async () => {
    const checks = {
        database: await checkDatabaseHealth(),
        redis: await checkRedisHealth(),
        memory: checkMemoryHealth(),
        uptime: checkUptimeHealth(),
    };
    const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
    return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        checks,
    };
};
// Perform detailed health check
const performDetailedHealthCheck = async () => {
    const checks = {
        database: await checkDatabaseHealthDetailed(),
        redis: await checkRedisHealthDetailed(),
        memory: checkMemoryHealthDetailed(),
        uptime: checkUptimeHealthDetailed(),
        disk: checkDiskHealth(),
        network: checkNetworkHealth(),
    };
    const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
    return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        checks,
    };
};
// Perform readiness check
const performReadinessCheck = async () => {
    const checks = {
        database: await checkDatabaseReadiness(),
        redis: await checkRedisReadiness(),
        application: checkApplicationReadiness(),
    };
    const allReady = Object.values(checks).every(check => check.ready);
    return {
        ready: allReady,
        timestamp: new Date().toISOString(),
        checks,
    };
};
// Database health check
const checkDatabaseHealth = async () => {
    try {
        // This would use your actual database connection
        // await db.raw('SELECT 1');
        return { status: 'healthy', message: 'Database connection successful' };
    }
    catch (error) {
        logger_1.logger.error('Database health check failed', { error });
        const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
        return { status: 'unhealthy', message: 'Database connection failed', error: errorMessage };
    }
};
// Redis health check
const checkRedisHealth = async () => {
    try {
        // This would use your actual Redis connection
        // await redis.ping();
        return { status: 'healthy', message: 'Redis connection successful' };
    }
    catch (error) {
        logger_1.logger.error('Redis health check failed', { error });
        const errorMessage = error instanceof Error ? error.message : 'Unknown Redis error';
        return { status: 'unhealthy', message: 'Redis connection failed', error: errorMessage };
    }
};
// Memory health check
const checkMemoryHealth = () => {
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    if (heapUsedPercent > 90) {
        return { status: 'unhealthy', message: 'High memory usage', usage: heapUsedPercent };
    }
    return { status: 'healthy', message: 'Memory usage normal', usage: heapUsedPercent };
};
// Uptime health check
const checkUptimeHealth = () => {
    const uptime = process.uptime();
    const maxUptime = 7 * 24 * 60 * 60; // 7 days
    if (uptime > maxUptime) {
        return { status: 'warning', message: 'Long uptime detected', uptime };
    }
    return { status: 'healthy', message: 'Uptime normal', uptime };
};
// Detailed health checks
const checkDatabaseHealthDetailed = async () => {
    try {
        // Add more detailed database checks
        return { status: 'healthy', message: 'Database detailed check passed' };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
        return { status: 'unhealthy', message: 'Database detailed check failed', error: errorMessage };
    }
};
const checkRedisHealthDetailed = async () => {
    try {
        // Add more detailed Redis checks
        return { status: 'healthy', message: 'Redis detailed check passed' };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown Redis error';
        return { status: 'unhealthy', message: 'Redis detailed check failed', error: errorMessage };
    }
};
const checkMemoryHealthDetailed = () => {
    const memUsage = process.memoryUsage();
    return {
        status: 'healthy',
        message: 'Memory detailed check passed',
        details: {
            rss: memUsage.rss,
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external,
        },
    };
};
const checkUptimeHealthDetailed = () => {
    const uptime = process.uptime();
    return {
        status: 'healthy',
        message: 'Uptime detailed check passed',
        details: {
            uptime,
            startTime: new Date(Date.now() - uptime * 1000).toISOString(),
        },
    };
};
const checkDiskHealth = () => {
    // This would check disk space
    return { status: 'healthy', message: 'Disk space adequate' };
};
const checkNetworkHealth = () => {
    // This would check network connectivity
    return { status: 'healthy', message: 'Network connectivity normal' };
};
// Readiness checks
const checkDatabaseReadiness = async () => {
    try {
        // Check if database is ready to accept connections
        return { ready: true, message: 'Database ready' };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
        return { ready: false, message: 'Database not ready', error: errorMessage };
    }
};
const checkRedisReadiness = async () => {
    try {
        // Check if Redis is ready to accept connections
        return { ready: true, message: 'Redis ready' };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown Redis error';
        return { ready: false, message: 'Redis not ready', error: errorMessage };
    }
};
const checkApplicationReadiness = () => {
    // Check if application is ready to serve requests
    return { ready: true, message: 'Application ready' };
};
// Metric recording functions
const recordDatabaseQuery = (operation, table, duration) => {
    dbQueryDuration.observe({ operation, table }, duration);
};
exports.recordDatabaseQuery = recordDatabaseQuery;
const recordRedisOperation = (operation, duration, status) => {
    redisOperationDuration.observe({ operation }, duration);
    redisOperationsTotal.inc({ operation, status });
};
exports.recordRedisOperation = recordRedisOperation;
const recordUserRegistration = () => {
    userRegistrations.inc();
};
exports.recordUserRegistration = recordUserRegistration;
const recordLessonCompletion = (lessonType, difficulty) => {
    lessonCompletions.inc({ lesson_type: lessonType, difficulty });
};
exports.recordLessonCompletion = recordLessonCompletion;
const recordActiveUser = (count) => {
    activeUsers.set(count);
};
exports.recordActiveUser = recordActiveUser;
const recordKioskModeSession = (durationMinutes) => {
    let durationRange = 'short';
    if (durationMinutes > 60)
        durationRange = 'long';
    else if (durationMinutes > 30)
        durationRange = 'medium';
    kioskModeSessions.inc({ duration_range: durationRange });
};
exports.recordKioskModeSession = recordKioskModeSession;
const recordDatabaseConnection = (active) => {
    dbConnectionsActive.set(active);
};
exports.recordDatabaseConnection = recordDatabaseConnection;
const recordDatabaseConnectionTotal = () => {
    dbConnectionsTotal.inc();
};
exports.recordDatabaseConnectionTotal = recordDatabaseConnectionTotal;
// Custom metric functions
const getCustomMetric = (name) => {
    return customMetrics.get(name);
};
exports.getCustomMetric = getCustomMetric;
const incrementCustomCounter = (name, labels = {}) => {
    const metric = customMetrics.get(name);
    if (metric) {
        metric.inc(labels);
    }
};
exports.incrementCustomCounter = incrementCustomCounter;
const setCustomGauge = (name, value, labels = {}) => {
    const metric = customMetrics.get(name);
    if (metric) {
        metric.set(labels, value);
    }
};
exports.setCustomGauge = setCustomGauge;
const observeCustomHistogram = (name, value, labels = {}) => {
    const metric = customMetrics.get(name);
    if (metric) {
        metric.observe(labels, value);
    }
};
exports.observeCustomHistogram = observeCustomHistogram;
// Performance monitoring
const measureAsync = async (operation, fn, labels = {}) => {
    const startTime = Date.now();
    try {
        const result = await fn();
        const duration = (Date.now() - startTime) / 1000;
        // Record success metric
        const successMetric = (0, exports.getCustomMetric)(`${operation}_success_duration`);
        if (successMetric) {
            successMetric.observe(labels, duration);
        }
        return result;
    }
    catch (error) {
        const duration = (Date.now() - startTime) / 1000;
        // Record error metric
        const errorMetric = (0, exports.getCustomMetric)(`${operation}_error_duration`);
        if (errorMetric) {
            errorMetric.observe(labels, duration);
        }
        throw error;
    }
};
exports.measureAsync = measureAsync;
