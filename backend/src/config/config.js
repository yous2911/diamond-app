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
exports.config = exports.validateEnvironment = exports.loggingConfig = exports.monitoringConfig = exports.uploadConfig = exports.cookieConfig = exports.emailConfig = exports.gdprConfig = exports.corsConfig = exports.helmetConfig = exports.ddosConfig = exports.globalRateLimitConfig = exports.authRateLimitConfig = exports.rateLimitConfig = exports.jwtConfig = exports.redisConfig = exports.dbConfig = exports.isTest = exports.isProduction = exports.isDevelopment = void 0;
const dotenv = __importStar(require("dotenv"));
const zod_1 = require("zod");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
// For test environment, disable Redis and use memory cache
if (process.env.NODE_ENV === 'test') {
    process.env.REDIS_ENABLED = 'false';
    process.env.DB_HOST = process.env.DB_HOST || 'localhost';
    process.env.DB_USER = process.env.DB_USER || 'root';
    process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'thisisREALLYIT29!';
    process.env.DB_NAME = process.env.DB_NAME || 'reved_kids';
    // Set required secrets for tests
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-for-testing-only-32-chars';
    process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'testtesttest32charabcdefghijklmn';
    process.env.COOKIE_SECRET = process.env.COOKIE_SECRET || 'test-cookie-secret-for-testing-only-32-chars';
    // Disable rate limiting for tests
    process.env.RATE_LIMIT_MAX = '10000';
    process.env.RATE_LIMIT_AUTH_MAX = '1000';
    process.env.RATE_LIMIT_GLOBAL_MAX = '50000';
}
else {
    // FORCE load ONLY env.backend - ignore all other .env files
    const envPath = path.join(process.cwd(), 'env.backend');
    // Verify the file exists
    if (!fs.existsSync(envPath)) {
        console.error('❌ env.backend file not found at:', envPath);
        process.exit(1);
    }
    // Clear any existing environment variables that might interfere
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.REDIS_ENABLED;
    // Load ONLY from env.backend
    const result = dotenv.config({
        path: envPath,
        override: true // Override any existing env vars
    });
    if (result.error) {
        console.error('❌ Failed to load env.backend:', result.error.message);
        process.exit(1);
    }
    console.log('✅ Loaded environment from:', envPath);
}
// Configuration chargée - variables sensibles non loggées pour la sécurité
// Flexible configuration schema with sensible defaults
const configSchema = zod_1.z.object({
    // Server Configuration
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().min(1000).max(65535).default(3003),
    HOST: zod_1.z.string().default('0.0.0.0'),
    // Database Configuration (flexible for development)
    DB_HOST: zod_1.z.string().default('localhost'),
    DB_PORT: zod_1.z.coerce.number().default(3306),
    DB_USER: zod_1.z.string().default('root'),
    DB_PASSWORD: zod_1.z.string(),
    DB_NAME: zod_1.z.string().default('reved_kids'),
    DB_CONNECTION_LIMIT: zod_1.z.coerce.number().default(20),
    // SSL Configuration for Production
    DB_SSL_CA: zod_1.z.string().optional(),
    DB_SSL_KEY: zod_1.z.string().optional(),
    DB_SSL_CERT: zod_1.z.string().optional(),
    // Redis Configuration (optional)
    REDIS_HOST: zod_1.z.string().default('localhost'),
    REDIS_PORT: zod_1.z.coerce.number().default(6379),
    REDIS_PASSWORD: zod_1.z.string().optional(),
    REDIS_DB: zod_1.z.coerce.number().default(0),
    REDIS_ENABLED: zod_1.z.coerce.boolean().default(false), // Disabled by default for easier setup
    // Security (with development fallbacks)
    JWT_SECRET: zod_1.z.string().min(32, { message: 'JWT_SECRET must be at least 32 characters long' }),
    JWT_EXPIRES_IN: zod_1.z.string().default('24h'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32, { message: 'JWT_REFRESH_SECRET must be at least 32 characters long' }),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    ENCRYPTION_KEY: zod_1.z.string().length(32, { message: 'ENCRYPTION_KEY must be 32 characters long' }),
    COOKIE_SECRET: zod_1.z.string().min(32, { message: 'COOKIE_SECRET must be at least 32 characters long' }),
    // Production security settings
    TRUST_PROXY: zod_1.z.coerce.boolean().default(true),
    SECURE_COOKIES: zod_1.z.coerce.boolean().default(false),
    SAME_SITE: zod_1.z.enum(['strict', 'lax', 'none']).default('lax'),
    HTTPS_ONLY: zod_1.z.coerce.boolean().default(false),
    // Rate Limiting
    RATE_LIMIT_MAX: zod_1.z.coerce.number().default(100),
    RATE_LIMIT_WINDOW: zod_1.z.coerce.number().default(900000), // 15 minutes
    RATE_LIMIT_AUTH_MAX: zod_1.z.coerce.number().default(10), // Stricter for auth endpoints
    RATE_LIMIT_AUTH_WINDOW: zod_1.z.coerce.number().default(900000), // 15 minutes
    RATE_LIMIT_GLOBAL_MAX: zod_1.z.coerce.number().default(10000), // Global rate limit
    RATE_LIMIT_GLOBAL_WINDOW: zod_1.z.coerce.number().default(3600000), // 1 hour
    // DDoS Protection
    DDOS_MAX_REQUESTS: zod_1.z.coerce.number().default(1000),
    DDOS_TIME_WINDOW: zod_1.z.coerce.number().default(60000), // 1 minute
    DDOS_BAN_DURATION: zod_1.z.coerce.number().default(3600000), // 1 hour
    // File Upload Security
    MAX_FILE_SIZE: zod_1.z.coerce.number().default(10485760), // 10MB
    MAX_FILES_PER_REQUEST: zod_1.z.coerce.number().default(5),
    UPLOAD_PATH: zod_1.z.string().default('./uploads'),
    ALLOWED_EXTENSIONS: zod_1.z.string().default('.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx'),
    SCAN_UPLOADS: zod_1.z.coerce.boolean().default(true),
    // Monitoring & Health Checks
    ENABLE_METRICS: zod_1.z.coerce.boolean().default(true),
    METRICS_INTERVAL: zod_1.z.coerce.number().default(60000),
    HEALTH_CHECK_TIMEOUT: zod_1.z.coerce.number().default(5000),
    PROMETHEUS_ENABLED: zod_1.z.coerce.boolean().default(true),
    PROMETHEUS_PORT: zod_1.z.coerce.number().default(9090),
    // Cache
    CACHE_TTL: zod_1.z.coerce.number().default(900),
    CACHE_MAX_SIZE: zod_1.z.coerce.number().default(1000),
    // Performance
    REQUEST_TIMEOUT: zod_1.z.coerce.number().default(30000),
    BODY_LIMIT: zod_1.z.coerce.number().default(10485760),
    // CORS
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:3000,http://localhost:3001'),
    CORS_CREDENTIALS: zod_1.z.coerce.boolean().default(true),
    // Structured Logging
    LOG_LEVEL: zod_1.z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    LOG_FILE: zod_1.z.string().optional().default(''),
    LOG_FORMAT: zod_1.z.enum(['json', 'pretty']).default('json'),
    LOG_ROTATION: zod_1.z.coerce.boolean().default(true),
    LOG_MAX_SIZE: zod_1.z.string().default('100MB'),
    LOG_MAX_FILES: zod_1.z.coerce.number().default(10),
    // WebSocket
    WS_HEARTBEAT_INTERVAL: zod_1.z.coerce.number().default(30000),
    WS_MAX_CONNECTIONS: zod_1.z.coerce.number().default(1000),
    // GDPR Configuration
    GDPR_ENABLED: zod_1.z.coerce.boolean().default(true),
    PARENTAL_CONSENT_REQUIRED: zod_1.z.coerce.boolean().default(true),
    CONSENT_TOKEN_EXPIRY_HOURS: zod_1.z.coerce.number().default(168), // 7 days
    DATA_RETENTION_DAYS: zod_1.z.coerce.number().default(1095), // 3 years
    AUDIT_LOG_RETENTION_DAYS: zod_1.z.coerce.number().default(2190), // 6 years
    ANONYMIZATION_AFTER_INACTIVITY_DAYS: zod_1.z.coerce.number().default(730), // 2 years
    ENCRYPTION_KEY_ROTATION_DAYS: zod_1.z.coerce.number().default(90),
    GDPR_REQUEST_DEADLINE_DAYS: zod_1.z.coerce.number().default(30),
    // Email Configuration for GDPR
    SMTP_HOST: zod_1.z.string().default('localhost'),
    SMTP_PORT: zod_1.z.coerce.number().default(587),
    SMTP_USER: zod_1.z.string().default(''),
    SMTP_PASS: zod_1.z.string().optional(),
    SMTP_FROM: zod_1.z.string().default('noreply@revedkids.com'),
    SUPPORT_EMAIL: zod_1.z.string().default('support@revedkids.com'),
}).refine((data) => {
    if (data.NODE_ENV === 'production') {
        return data.JWT_SECRET.length >= 32 && data.JWT_REFRESH_SECRET.length >= 32;
    }
    return true;
}, {
    message: 'In production, JWT_SECRET and JWT_REFRESH_SECRET must be at least 32 characters long.',
    path: ['JWT_SECRET'],
});
let config;
try {
    exports.config = config = configSchema.parse(process.env);
}
catch (error) {
    if (error instanceof zod_1.z.ZodError) {
        console.error('❌ Invalid environment variables:');
        error.errors.forEach((err) => {
            console.error(`- ${err.path.join('.')}: ${err.message}`);
        });
        process.exit(1);
    }
    console.error('❌ An unexpected error occurred during configuration loading:', error);
    process.exit(1);
}
// Environment helpers
exports.isDevelopment = config.NODE_ENV === 'development';
exports.isProduction = config.NODE_ENV === 'production';
exports.isTest = config.NODE_ENV === 'test';
// Now, call your validation function to perform production-specific checks.
validateEnvironment();
// Database configuration for Drizzle
exports.dbConfig = {
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    connectionLimit: config.DB_CONNECTION_LIMIT,
    ssl: exports.isProduction ? { rejectUnauthorized: true } : undefined,
};
// Redis configuration
exports.redisConfig = {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT,
    password: config.REDIS_PASSWORD || undefined,
    db: config.REDIS_DB,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    showFriendlyErrorStack: exports.isDevelopment,
    connectTimeout: 10000,
    commandTimeout: 5000,
};
// JWT configuration
exports.jwtConfig = {
    secret: config.JWT_SECRET,
    expiresIn: config.JWT_EXPIRES_IN,
    refreshSecret: config.JWT_REFRESH_SECRET,
    refreshExpiresIn: config.JWT_REFRESH_EXPIRES_IN,
    algorithm: 'HS256',
    issuer: 'reved-kids',
    audience: 'reved-kids-students',
};
// Rate limiting configuration
exports.rateLimitConfig = {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
    cache: 10000,
    allowList: exports.isDevelopment ? ['127.0.0.1', 'localhost'] : [],
    continueExceeding: true,
    skipOnError: true,
    keyGenerator: (req) => {
        return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    },
};
// Auth rate limiting (stricter)
exports.authRateLimitConfig = {
    max: config.RATE_LIMIT_AUTH_MAX,
    timeWindow: config.RATE_LIMIT_AUTH_WINDOW,
    cache: 1000,
    allowList: exports.isDevelopment ? ['127.0.0.1', 'localhost'] : [],
    continueExceeding: false,
    skipOnError: false,
    keyGenerator: (req) => {
        return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    },
};
// Global rate limiting
exports.globalRateLimitConfig = {
    max: config.RATE_LIMIT_GLOBAL_MAX,
    timeWindow: config.RATE_LIMIT_GLOBAL_WINDOW,
    cache: 50000,
    skipOnError: true,
    keyGenerator: (req) => {
        return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    },
};
// DDoS protection configuration
exports.ddosConfig = {
    maxRequests: config.DDOS_MAX_REQUESTS,
    timeWindow: config.DDOS_TIME_WINDOW,
    banDuration: config.DDOS_BAN_DURATION,
};
// Helmet configuration
exports.helmetConfig = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
};
// CORS configuration
exports.corsConfig = {
    origin: exports.isDevelopment
        ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3004', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3004']
        : config.CORS_ORIGIN.split(',').map(origin => origin.trim()),
    credentials: config.CORS_CREDENTIALS,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['X-Total-Count', 'X-Request-ID'],
};
// GDPR configuration
exports.gdprConfig = {
    enabled: config.GDPR_ENABLED,
    parentalConsentRequired: config.PARENTAL_CONSENT_REQUIRED,
    consentTokenExpiryHours: config.CONSENT_TOKEN_EXPIRY_HOURS,
    dataRetentionDays: config.DATA_RETENTION_DAYS,
    auditLogRetentionDays: config.AUDIT_LOG_RETENTION_DAYS,
    anonymizationAfterInactivityDays: config.ANONYMIZATION_AFTER_INACTIVITY_DAYS,
    encryptionKeyRotationDays: config.ENCRYPTION_KEY_ROTATION_DAYS,
    gdprRequestDeadlineDays: config.GDPR_REQUEST_DEADLINE_DAYS,
};
// Email configuration
exports.emailConfig = {
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
    from: config.SMTP_FROM,
    supportEmail: config.SUPPORT_EMAIL,
};
// Cookie configuration
exports.cookieConfig = {
    secret: config.COOKIE_SECRET,
    secure: config.SECURE_COOKIES || exports.isProduction,
    httpOnly: true,
    sameSite: config.SAME_SITE,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
// File upload configuration
exports.uploadConfig = {
    maxFileSize: config.MAX_FILE_SIZE,
    maxFilesPerRequest: config.MAX_FILES_PER_REQUEST,
    uploadPath: config.UPLOAD_PATH,
    allowedExtensions: config.ALLOWED_EXTENSIONS.split(',').map(ext => ext.trim()),
    scanUploads: config.SCAN_UPLOADS,
};
// Monitoring configuration
exports.monitoringConfig = {
    enableMetrics: config.ENABLE_METRICS,
    metricsInterval: config.METRICS_INTERVAL,
    healthCheckTimeout: config.HEALTH_CHECK_TIMEOUT,
    prometheusEnabled: config.PROMETHEUS_ENABLED,
    prometheusPort: config.PROMETHEUS_PORT,
};
// Logging configuration
exports.loggingConfig = {
    level: config.LOG_LEVEL,
    file: config.LOG_FILE,
    format: config.LOG_FORMAT,
    rotation: config.LOG_ROTATION,
    maxSize: config.LOG_MAX_SIZE,
    maxFiles: config.LOG_MAX_FILES,
};
// Enhanced validation with helpful messages
function validateEnvironment() {
    const warnings = [];
    const errors = [];
    // Check critical production settings
    if (exports.isProduction) {
        if (config.JWT_SECRET.includes('dev-') || config.JWT_SECRET.length < 32) {
            errors.push('JWT_SECRET must be changed and be at least 32 characters in production');
        }
        if (config.JWT_REFRESH_SECRET.includes('dev-') || config.JWT_REFRESH_SECRET.length < 32) {
            errors.push('JWT_REFRESH_SECRET must be changed and be at least 32 characters in production');
        }
        if (config.ENCRYPTION_KEY.includes('dev-') || config.ENCRYPTION_KEY.length < 32) {
            errors.push('ENCRYPTION_KEY must be changed and be at least 32 characters in production');
        }
        if (config.COOKIE_SECRET.includes('dev-') || config.COOKIE_SECRET.length < 32) {
            errors.push('COOKIE_SECRET must be changed and be at least 32 characters in production');
        }
        if (!config.DB_PASSWORD) {
            errors.push('Database password is required in production');
        }
        // SSL Certificate validation for production
        if (!config.DB_SSL_CA) {
            errors.push('DB_SSL_CA is required in production for secure database connections');
        }
        if (!config.HTTPS_ONLY) {
            warnings.push('HTTPS_ONLY should be enabled in production');
        }
        if (!config.SECURE_COOKIES) {
            warnings.push('SECURE_COOKIES should be enabled in production');
        }
        if (config.CORS_ORIGIN.includes('localhost')) {
            warnings.push('CORS_ORIGIN contains localhost in production');
        }
    }
    // Check database connection requirements
    if (!config.DB_HOST || !config.DB_NAME) {
        errors.push('Database host and name are required');
    }
    // Log warnings
    if (warnings.length > 0) {
        console.warn('⚠️  Configuration warnings:');
        warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    // Log errors and exit if critical
    if (errors.length > 0) {
        console.error('❌ Configuration errors:');
        errors.forEach(error => console.error(`  - ${error}`));
        throw new Error('Environment validation failed');
    }
    console.log('✅ Environment validation passed');
}
exports.validateEnvironment = validateEnvironment;
