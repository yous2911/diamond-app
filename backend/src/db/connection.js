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
exports.connection = exports.withTransaction = exports.reconnectDatabase = exports.disconnectDatabase = exports.getDatabase = exports.connectDatabase = exports.checkDatabaseHealth = exports.testConnection = exports.getPoolStats = exports.db = exports.config = void 0;
const mysql2_1 = require("drizzle-orm/mysql2");
const mysql = __importStar(require("mysql2/promise"));
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
const optimized_pool_1 = require("../config/optimized-pool");
// Re-export config for other modules
var config_2 = require("../config/config");
Object.defineProperty(exports, "config", { enumerable: true, get: function () { return config_2.config; } });
// Input sanitization for database credentials
function sanitizeDatabaseConfig(config) {
    return {
        host: config.host?.replace(/[^a-zA-Z0-9.-]/g, '') || 'localhost',
        port: Math.max(1, Math.min(65535, parseInt(config.port) || 3306)),
        user: config.user?.replace(/[^a-zA-Z0-9_]/g, '') || 'root',
        password: config.password || '',
        database: config.database?.replace(/[^a-zA-Z0-9_]/g, '') || 'reved_kids',
        connectionLimit: Math.max(1, Math.min(100, parseInt(config.connectionLimit) || 20))
    };
}
// Enhanced MySQL connection pool configuration with production optimizations
const poolConfig = (0, optimized_pool_1.getOptimizedPoolConfig)();
// Create MySQL connection pool
const connection = mysql.createPool(poolConfig);
exports.connection = connection;
// Create Drizzle instance
exports.db = (0, mysql2_1.drizzle)(connection);
// Connection pool event listeners for monitoring
connection.on('connection', (conn) => {
    logger_1.logger.info('New database connection established', {
        connectionId: conn.threadId,
        totalConnections: connection._allConnections?.length || 0
    });
});
connection.on('release', (conn) => {
    logger_1.logger.debug('Database connection released', {
        connectionId: conn.threadId
    });
});
// Handle pool errors with enhanced security logging
connection.on('error', (error) => {
    const errorInfo = {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
    };
    // Enhanced error categorization for security monitoring
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        logger_1.logger.error('Database access denied - check credentials', errorInfo);
    }
    else if (error.code === 'ECONNREFUSED') {
        logger_1.logger.error('Database connection refused - check host/port', errorInfo);
    }
    else if (error.code === 'ER_BAD_DB_ERROR') {
        logger_1.logger.error('Database does not exist', errorInfo);
    }
    else if (error.code === 'ER_DUP_ENTRY') {
        logger_1.logger.warn('Database duplicate entry error', errorInfo);
    }
    else if (error.code === 'ER_LOCK_WAIT_TIMEOUT') {
        logger_1.logger.warn('Database lock wait timeout', errorInfo);
    }
    else {
        logger_1.logger.error('Database pool error', errorInfo);
    }
});
// Get connection pool statistics
function getPoolStats() {
    const pool = connection;
    return {
        totalConnections: pool._allConnections?.length || 0,
        activeConnections: pool._activeConnections?.length || 0,
        idleConnections: pool._freeConnections?.length || 0,
        queuedRequests: pool._connectionQueue?.length || 0,
        acquiredConnections: pool._acquiredConnections || 0,
        releasedConnections: pool._releasedConnections || 0,
        createdConnections: pool._createdConnections || 0,
        destroyedConnections: pool._destroyedConnections || 0
    };
}
exports.getPoolStats = getPoolStats;
// Test connection function with retry logic
async function testConnection(retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const startTime = Date.now();
            const [result] = await connection.execute('SELECT 1 as test');
            const responseTime = Date.now() - startTime;
            logger_1.logger.info('Database connection test successful', {
                attempt,
                responseTime,
                poolStats: getPoolStats()
            });
            return result !== null;
        }
        catch (error) {
            logger_1.logger.warn('Database connection test failed', {
                attempt,
                retries,
                error: error instanceof Error ? error.message : 'Unknown error',
                poolStats: getPoolStats()
            });
            if (attempt === retries) {
                logger_1.logger.error('Database connection failed after all retries', {
                    attempts: retries,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                return false;
            }
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }
    return false;
}
exports.testConnection = testConnection;
// Enhanced health check function with detailed metrics
async function checkDatabaseHealth() {
    const start = Date.now();
    const poolStats = getPoolStats();
    const lastChecked = new Date().toISOString();
    try {
        // Test basic connectivity
        const [connectionResult] = await Promise.allSettled([
            connection.execute('SELECT 1 as connection_test'),
            connection.execute('SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ?', [config_1.dbConfig.database])
        ]);
        const responseTime = Date.now() - start;
        const poolUtilization = poolStats.totalConnections > 0
            ? (poolStats.activeConnections / poolStats.totalConnections) * 100
            : 0;
        // Determine health status
        let status = 'healthy';
        if (connectionResult.status === 'rejected') {
            status = 'unhealthy';
        }
        else if (responseTime > 5000 || poolUtilization > 90) {
            status = 'degraded';
        }
        const checks = {
            connection: connectionResult.status === 'fulfilled',
            query: connectionResult.status === 'fulfilled',
            poolUtilization
        };
        logger_1.logger.debug('Database health check completed', {
            status,
            responseTime,
            poolStats,
            checks
        });
        return {
            status,
            responseTime,
            poolStats,
            checks,
            lastChecked
        };
    }
    catch (error) {
        const responseTime = Date.now() - start;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger_1.logger.error('Database health check failed', {
            error: errorMessage,
            responseTime,
            poolStats
        });
        return {
            status: 'unhealthy',
            responseTime,
            poolStats,
            checks: {
                connection: false,
                query: false,
                poolUtilization: poolStats.totalConnections > 0
                    ? (poolStats.activeConnections / poolStats.totalConnections) * 100
                    : 0
            },
            error: errorMessage,
            lastChecked
        };
    }
}
exports.checkDatabaseHealth = checkDatabaseHealth;
// Enhanced connection management
let connectionInitialized = false;
let shutdownInProgress = false;
async function connectDatabase() {
    if (connectionInitialized) {
        logger_1.logger.info('Database already connected');
        return;
    }
    try {
        // Sanitize database configuration for logging
        const sanitizedConfig = sanitizeDatabaseConfig(config_1.dbConfig);
        // Validate SSL configuration for production
        if (config_1.isProduction && config_1.dbConfig.ssl) {
            if (!process.env.DB_SSL_CA) {
                throw new Error('DB_SSL_CA is required in production for secure database connections');
            }
            logger_1.logger.info('SSL certificate validation enabled for production');
        }
        logger_1.logger.info('Initializing database connection...', {
            host: sanitizedConfig.host,
            port: sanitizedConfig.port,
            database: sanitizedConfig.database,
            connectionLimit: sanitizedConfig.connectionLimit,
            environment: config_1.dbConfig.host ? 'configured' : 'unknown',
            sslEnabled: !!config_1.dbConfig.ssl
        });
        // Test initial connection
        const isConnected = await testConnection();
        if (!isConnected) {
            throw new Error('Failed to establish database connection');
        }
        // Set up connection pool monitoring interval
        const monitoringInterval = setInterval(() => {
            if (shutdownInProgress) {
                clearInterval(monitoringInterval);
                return;
            }
            const stats = getPoolStats();
            const utilizationPercent = stats.totalConnections > 0
                ? (stats.activeConnections / stats.totalConnections) * 100
                : 0;
            // Log warning if pool utilization is high
            if (utilizationPercent > 80) {
                logger_1.logger.warn('High database connection pool utilization', {
                    utilizationPercent: Math.round(utilizationPercent),
                    poolStats: stats
                });
            }
            // Log pool stats periodically (debug level)
            logger_1.logger.debug('Database connection pool stats', { poolStats: stats });
        }, 30000); // Every 30 seconds
        connectionInitialized = true;
        logger_1.logger.info('Database connection established successfully', {
            poolStats: getPoolStats()
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to database', {
            error: error instanceof Error ? error.message : 'Unknown error',
            config: {
                host: config_1.dbConfig.host,
                port: config_1.dbConfig.port,
                database: config_1.dbConfig.database
            }
        });
        throw error;
    }
}
exports.connectDatabase = connectDatabase;
function getDatabase() {
    if (!connectionInitialized) {
        logger_1.logger.warn('Database not yet initialized, returning uninitialized instance');
    }
    return exports.db;
}
exports.getDatabase = getDatabase;
async function disconnectDatabase() {
    if (!connectionInitialized || shutdownInProgress) {
        return;
    }
    shutdownInProgress = true;
    logger_1.logger.info('Starting graceful database disconnect...');
    try {
        // Wait for active connections to finish (max 30 seconds)
        const maxWaitTime = 30000;
        const startTime = Date.now();
        while (Date.now() - startTime < maxWaitTime) {
            const stats = getPoolStats();
            if (stats.activeConnections === 0) {
                logger_1.logger.info('All active connections closed');
                break;
            }
            logger_1.logger.info(`Waiting for ${stats.activeConnections} active connections to close...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        // Force close the connection pool
        await connection.end();
        connectionInitialized = false;
        logger_1.logger.info('Database connection closed successfully');
    }
    catch (error) {
        logger_1.logger.error('Error during database disconnect:', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
    finally {
        shutdownInProgress = false;
    }
}
exports.disconnectDatabase = disconnectDatabase;
// Function to handle database reconnection
async function reconnectDatabase() {
    logger_1.logger.info('Attempting database reconnection...');
    try {
        await disconnectDatabase();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        await connectDatabase();
        return true;
    }
    catch (error) {
        logger_1.logger.error('Database reconnection failed', {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return false;
    }
}
exports.reconnectDatabase = reconnectDatabase;
// Database transaction helper with retry logic
async function withTransaction(callback, options = {}) {
    const { retries = 3, timeout = 30000 } = options;
    for (let attempt = 1; attempt <= retries; attempt++) {
        const conn = await connection.getConnection();
        try {
            await conn.beginTransaction();
            // Set transaction timeout
            await conn.execute(`SET SESSION innodb_lock_wait_timeout = ${Math.floor(timeout / 1000)}`);
            const result = await callback(conn);
            await conn.commit();
            logger_1.logger.debug('Transaction completed successfully', { attempt });
            return result;
        }
        catch (error) {
            await conn.rollback();
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger_1.logger.warn('Transaction failed', {
                attempt,
                retries,
                error: errorMessage
            });
            if (attempt === retries) {
                logger_1.logger.error('Transaction failed after all retries', {
                    attempts: retries,
                    error: errorMessage
                });
                throw error;
            }
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
        finally {
            conn.release();
        }
    }
    throw new Error('Transaction failed unexpectedly');
}
exports.withTransaction = withTransaction;
// Cleanup on process exit
process.on('SIGINT', async () => {
    logger_1.logger.info('Received SIGINT, closing database connections...');
    await disconnectDatabase();
});
process.on('SIGTERM', async () => {
    logger_1.logger.info('Received SIGTERM, closing database connections...');
    await disconnectDatabase();
});
