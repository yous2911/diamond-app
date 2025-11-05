// OPTIMIZED DATABASE CONNECTION POOL CONFIGURATION
// Production-grade performance settings

import { PoolOptions } from 'mysql2';
import { config } from './config';

// Calculate optimal pool size based on system resources
function calculateOptimalPoolSize(): number {
  const cpuCores = require('os').cpus().length;
  const basePoolSize = cpuCores * 2; // Rule of thumb: 2x CPU cores

  // Adjust based on environment
  if (config.NODE_ENV === 'production') {
    return Math.min(Math.max(basePoolSize, 20), 50); // Production: 20-50 connections
  } else if (config.NODE_ENV === 'test') {
    return Math.min(basePoolSize, 5); // Test: Limited connections
  } else {
    return Math.min(basePoolSize, 15); // Development: Moderate
  }
}

// Advanced pool configuration for production performance
export const optimizedPoolConfig: PoolOptions = {
  // Basic connection settings
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,

  // OPTIMIZED POOL SETTINGS
  connectionLimit: calculateOptimalPoolSize(),
  maxIdle: Math.floor(calculateOptimalPoolSize() * 0.3), // 30% idle connections
  idleTimeout: 300000, // 5 minutes idle timeout

  // Advanced connection management
  acquireTimeout: 15000, // 15 seconds to acquire connection
  timeout: 30000, // 30 seconds query timeout
  keepAliveInitialDelay: 30000, // 30 seconds before first keepalive
  enableKeepAlive: true, // Enable TCP keepalive

  // Performance optimizations
  multipleStatements: false, // Security: prevent SQL injection
  dateStrings: false, // Return proper Date objects for better performance
  supportBigNumbers: true,
  bigNumberStrings: false, // Use numbers when possible

  // Advanced MySQL settings
  charset: 'utf8mb4',
  timezone: 'Z', // UTC timezone (faster than local)

  // Connection settings for performance
  connectTimeout: 10000, // 10 seconds connection timeout
  reconnect: true, // Auto-reconnect on connection loss

  // Type casting optimization
  typeCast: function (field: any, next: any) {
    // Fast boolean conversion for TINYINT(1)
    if (field.type === 'TINY' && field.length === 1) {
      return field.string() === '1';
    }

    // Optimized JSON parsing
    if (field.type === 'JSON') {
      const str = field.string();
      if (!str) return null;
      try {
        return JSON.parse(str);
      } catch {
        return str; // Return as string if parsing fails
      }
    }

    // Let MySQL handle other types natively
    return next();
  },

  // SSL Configuration for production
  ssl: config.NODE_ENV === 'production' && config.DB_SSL ? {
    rejectUnauthorized: true,
    ca: process.env.DB_SSL_CA,
    key: process.env.DB_SSL_KEY,
    cert: process.env.DB_SSL_CERT,
  } : false,

  // Advanced flags for performance
  flags: [
    'FOUND_ROWS', // Enable SQL_CALC_FOUND_ROWS
    'IGNORE_SPACE', // Ignore spaces after function names
    'LONG_PASSWORD', // Use improved version of Password Authentication Plugin
    'TRANSACTIONS', // Enable transaction support
    'SECURE_CONNECTION', // Use 4.1 protocol
    'MULTI_RESULTS', // Handle multiple result sets
    'PS_MULTI_RESULTS', // Handle multiple result sets in prepared statements
  ].join(','),
};

// Connection pool monitoring configuration
export const poolMonitoringConfig = {
  // Health check intervals
  healthCheckInterval: 30000, // 30 seconds
  connectionMonitorInterval: 60000, // 1 minute

  // Alert thresholds
  highUtilizationThreshold: 80, // 80% pool utilization
  criticalUtilizationThreshold: 95, // 95% pool utilization
  slowQueryThreshold: 5000, // 5 seconds

  // Pool management
  autoReconnectAttempts: 5,
  autoReconnectDelay: 2000, // 2 seconds between attempts
  gracefulShutdownTimeout: 30000, // 30 seconds for graceful shutdown

  // Performance monitoring
  enableQueryLogging: config.NODE_ENV !== 'production',
  enableSlowQueryLogging: true,
  enableConnectionLogging: config.NODE_ENV === 'development',
};

// Query optimization settings
export const queryOptimizationConfig = {
  // Transaction settings
  defaultTransactionTimeout: 30000, // 30 seconds
  maxTransactionRetries: 3,
  transactionRetryDelay: 1000, // 1 second base delay

  // Query execution settings
  defaultQueryTimeout: 15000, // 15 seconds
  bulkOperationTimeout: 60000, // 1 minute for bulk operations

  // Cache settings
  queryCacheEnabled: config.NODE_ENV === 'production',
  queryCacheSize: 256, // MB

  // Connection-specific MySQL variables for performance
  sessionVariables: {
    'innodb_lock_wait_timeout': 15, // 15 seconds lock wait
    'wait_timeout': 3600, // 1 hour session timeout
    'interactive_timeout': 3600, // 1 hour interactive timeout
    'max_allowed_packet': 64 * 1024 * 1024, // 64MB max packet size
    'sql_mode': 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO',
    'autocommit': 1, // Enable autocommit by default
    'tx_isolation': 'READ-COMMITTED', // Optimal isolation level for most apps
  }
};

// Production-specific optimizations
export const productionOptimizations = {
  // Connection pool scaling
  enableDynamicPoolSizing: true,
  minPoolSize: Math.floor(calculateOptimalPoolSize() * 0.2), // 20% minimum
  maxPoolSize: calculateOptimalPoolSize(),

  // Connection validation
  testOnBorrow: true,
  testOnReturn: false,
  testWhileIdle: true,
  validationQuery: 'SELECT 1',

  // Advanced performance settings
  enablePreparedStatements: true,
  preparedStatementCacheSize: 100,
  enableResultSetCaching: true,
  resultSetCacheSize: 50,

  // Connection lifecycle management
  connectionCreationRetryAttempts: 3,
  connectionValidationTimeout: 3000, // 3 seconds
  evictionRunIntervalMillis: 300000, // 5 minutes
  minEvictableIdleTimeMillis: 600000, // 10 minutes

  // Security and monitoring
  enableConnectionEncryption: config.NODE_ENV === 'production',
  enableSlowQueryLog: true,
  slowQueryThreshold: 2000, // 2 seconds for slow query log
  enableGeneralLog: config.NODE_ENV === 'development',

  // Failover and resilience
  enableFailover: true,
  failoverTimeout: 5000, // 5 seconds
  maxFailoverAttempts: 3,

  // Memory management
  enableMemoryMonitoring: true,
  maxMemoryUsage: 512 * 1024 * 1024, // 512MB max memory usage
  memoryCheckInterval: 60000, // 1 minute
};

// Export function to get optimized configuration
export function getOptimizedPoolConfig(): PoolOptions {
  const baseConfig = { ...optimizedPoolConfig };

  // Apply production optimizations
  if (config.NODE_ENV === 'production') {
    return {
      ...baseConfig,
      connectionLimit: productionOptimizations.maxPoolSize,
      acquireTimeout: 10000, // Tighter timeout in production
      timeout: 20000, // Tighter query timeout in production
    };
  }

  // Apply test optimizations
  if (config.NODE_ENV === 'test') {
    return {
      ...baseConfig,
      connectionLimit: 5,
      acquireTimeout: 5000,
      timeout: 10000,
      enableKeepAlive: false, // Disable keepalive in tests
    };
  }

  return baseConfig;
}