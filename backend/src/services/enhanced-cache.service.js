"use strict";
/**
 * Enhanced Redis Caching Service for RevEd Kids Backend
 * Provides intelligent caching with fallback, TTL management, and optimization
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.ExerciseCache = exports.StudentCache = exports.SessionCache = exports.cacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
class EnhancedCacheService {
    constructor() {
        this.redis = null;
        this.fallbackCache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            errors: 0,
            totalKeys: 0,
            memoryUsage: '0MB',
            connectionStatus: 'disconnected'
        };
        this.isEnabled = false;
        this.keyPrefix = 'revedkids:';
        this.maxFallbackSize = 1000;
        this.compressionThreshold = 1024; // Compress data larger than 1KB
        this.initialize();
        this.setupCleanupInterval();
    }
    async initialize() {
        try {
            if (!config_1.config.REDIS_ENABLED) {
                logger_1.logger.info('Redis caching disabled in configuration');
                return;
            }
            logger_1.logger.info('Initializing Redis cache service...', {
                host: config_1.config.REDIS_HOST,
                port: config_1.config.REDIS_PORT,
                database: config_1.config.REDIS_DB
            });
            this.redis = new ioredis_1.default({
                host: config_1.config.REDIS_HOST,
                port: config_1.config.REDIS_PORT,
                password: config_1.config.REDIS_PASSWORD,
                db: config_1.config.REDIS_DB || 0,
                maxRetriesPerRequest: 3,
                lazyConnect: true,
                keepAlive: 30000,
                connectTimeout: 10000,
                commandTimeout: 5000,
                family: 4
            });
            this.setupEventListeners();
            await this.redis.connect();
            this.isEnabled = true;
            logger_1.logger.info('Redis cache service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Redis cache service', { error });
            this.isEnabled = false;
            this.fallbackToMemoryCache();
        }
    }
    setupEventListeners() {
        if (!this.redis)
            return;
        this.redis.on('connect', () => {
            this.stats.connectionStatus = 'connected';
            logger_1.logger.info('Redis connected');
        });
        this.redis.on('reconnecting', () => {
            this.stats.connectionStatus = 'reconnecting';
            logger_1.logger.warn('Redis reconnecting...');
        });
        this.redis.on('error', (error) => {
            this.stats.connectionStatus = 'disconnected';
            this.stats.errors++;
            logger_1.logger.error('Redis connection error', { error });
            this.fallbackToMemoryCache();
        });
        this.redis.on('close', () => {
            this.stats.connectionStatus = 'disconnected';
            logger_1.logger.warn('Redis connection closed');
        });
    }
    fallbackToMemoryCache() {
        if (this.isEnabled) {
            logger_1.logger.warn('Falling back to in-memory cache');
            this.isEnabled = false;
        }
    }
    setupCleanupInterval() {
        // Clean expired entries from fallback cache every 5 minutes
        setInterval(() => {
            this.cleanupFallbackCache();
            this.updateStats();
        }, 5 * 60 * 1000);
    }
    cleanupFallbackCache() {
        const now = Date.now();
        let cleanedCount = 0;
        for (const [key, value] of this.fallbackCache.entries()) {
            if (value.expiry < now) {
                this.fallbackCache.delete(key);
                cleanedCount++;
            }
        }
        // Limit fallback cache size
        if (this.fallbackCache.size > this.maxFallbackSize) {
            const keysToRemove = Array.from(this.fallbackCache.keys())
                .slice(0, this.fallbackCache.size - this.maxFallbackSize);
            keysToRemove.forEach(key => this.fallbackCache.delete(key));
            cleanedCount += keysToRemove.length;
        }
        if (cleanedCount > 0) {
            logger_1.logger.debug('Cleaned up fallback cache', { removedEntries: cleanedCount });
        }
    }
    async updateStats() {
        try {
            if (this.redis && this.isEnabled) {
                const info = await this.redis.info('memory');
                const memoryMatch = info.match(/used_memory_human:(.+)/);
                if (memoryMatch) {
                    this.stats.memoryUsage = memoryMatch[1].trim();
                }
                this.stats.totalKeys = await this.redis.dbsize();
            }
        }
        catch (error) {
            logger_1.logger.debug('Failed to update cache stats', { error });
        }
    }
    generateKey(key, version) {
        const versionSuffix = version ? `:v${version}` : '';
        return `${this.keyPrefix}${key}${versionSuffix}`;
    }
    compressData(data) {
        const serialized = JSON.stringify(data);
        if (serialized.length > this.compressionThreshold) {
            // In a real implementation, you'd use a compression library like zlib
            // For now, we'll just use base64 encoding as a placeholder
            return Buffer.from(serialized).toString('base64');
        }
        return serialized;
    }
    decompressData(data) {
        try {
            if (Buffer.isBuffer(data)) {
                // Decompress if it's a buffer
                const decompressed = Buffer.from(data.toString(), 'base64').toString();
                return JSON.parse(decompressed);
            }
            else {
                return JSON.parse(data);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to decompress cache data', { error });
            throw error;
        }
    }
    /**
     * Get value from cache
     */
    async get(key, options = {}) {
        const startTime = Date.now();
        const fullKey = this.generateKey(key, options.version);
        try {
            let result = null;
            if (this.redis && this.isEnabled) {
                const cached = await this.redis.get(fullKey);
                if (cached !== null) {
                    result = this.decompressData(cached);
                    this.stats.hits++;
                }
                else {
                    this.stats.misses++;
                }
            }
            else {
                // Fallback to memory cache
                const cached = this.fallbackCache.get(fullKey);
                if (cached && cached.expiry > Date.now()) {
                    result = cached.data;
                    this.stats.hits++;
                }
                else {
                    this.fallbackCache.delete(fullKey);
                    this.stats.misses++;
                }
            }
            const responseTime = Date.now() - startTime;
            logger_1.logger.debug('Cache get operation', {
                key: fullKey,
                hit: result !== null,
                responseTime
            });
            return result;
        }
        catch (error) {
            this.stats.errors++;
            logger_1.logger.error('Cache get operation failed', { key: fullKey, error });
            return null;
        }
    }
    /**
     * Set value in cache
     */
    async set(key, value, options = {}) {
        const startTime = Date.now();
        const fullKey = this.generateKey(key, options.version);
        const ttl = options.ttl || config_1.config.CACHE_TTL || 3600; // Default 1 hour
        try {
            if (this.redis && this.isEnabled) {
                const compressed = options.compressed !== false ?
                    this.compressData(value) : JSON.stringify(value);
                await this.redis.setex(fullKey, ttl, compressed);
                // Set tags for invalidation if provided
                if (options.tags && options.tags.length > 0) {
                    const tagPromises = options.tags.map(tag => this.redis.sadd(`${this.keyPrefix}tag:${tag}`, fullKey));
                    await Promise.all(tagPromises);
                }
            }
            else {
                // Fallback to memory cache
                const expiry = Date.now() + (ttl * 1000);
                this.fallbackCache.set(fullKey, { data: value, expiry });
            }
            const responseTime = Date.now() - startTime;
            logger_1.logger.debug('Cache set operation', {
                key: fullKey,
                ttl,
                responseTime,
                tags: options.tags
            });
            return true;
        }
        catch (error) {
            this.stats.errors++;
            logger_1.logger.error('Cache set operation failed', { key: fullKey, error });
            return false;
        }
    }
    /**
     * Delete value from cache
     */
    async delete(key, version) {
        const fullKey = this.generateKey(key, version);
        try {
            if (this.redis && this.isEnabled) {
                const result = await this.redis.del(fullKey);
                return result > 0;
            }
            else {
                return this.fallbackCache.delete(fullKey);
            }
        }
        catch (error) {
            this.stats.errors++;
            logger_1.logger.error('Cache delete operation failed', { key: fullKey, error });
            return false;
        }
    }
    /**
     * Invalidate cache by tags
     */
    async invalidateByTags(tags) {
        if (!this.redis || !this.isEnabled) {
            logger_1.logger.warn('Tag-based invalidation not available with fallback cache');
            return 0;
        }
        try {
            let totalDeleted = 0;
            for (const tag of tags) {
                const tagKey = `${this.keyPrefix}tag:${tag}`;
                const keys = await this.redis.smembers(tagKey);
                if (keys.length > 0) {
                    const deleted = await this.redis.del(...keys);
                    totalDeleted += deleted;
                    // Clean up the tag set
                    await this.redis.del(tagKey);
                }
            }
            logger_1.logger.info('Cache invalidation by tags completed', {
                tags,
                keysDeleted: totalDeleted
            });
            return totalDeleted;
        }
        catch (error) {
            this.stats.errors++;
            logger_1.logger.error('Cache invalidation by tags failed', { tags, error });
            return 0;
        }
    }
    /**
     * Get or set pattern (cache-aside)
     */
    async getOrSet(key, fetchFunction, options = {}) {
        // Try to get from cache first
        const cached = await this.get(key, options);
        if (cached !== null) {
            return cached;
        }
        // Fetch from source
        const startTime = Date.now();
        const data = await fetchFunction();
        const fetchTime = Date.now() - startTime;
        // Store in cache
        await this.set(key, data, options);
        logger_1.logger.debug('Cache miss - fetched and stored', {
            key: this.generateKey(key, options.version),
            fetchTime
        });
        return data;
    }
    /**
     * Batch get multiple keys
     */
    async mget(keys, options = {}) {
        if (!this.redis || !this.isEnabled) {
            // Fallback to individual gets
            return Promise.all(keys.map(key => this.get(key, options)));
        }
        try {
            const fullKeys = keys.map(key => this.generateKey(key, options.version));
            const results = await this.redis.mget(...fullKeys);
            return results.map((result, index) => {
                if (result !== null) {
                    this.stats.hits++;
                    return this.decompressData(result);
                }
                else {
                    this.stats.misses++;
                    return null;
                }
            });
        }
        catch (error) {
            this.stats.errors++;
            logger_1.logger.error('Batch cache get operation failed', { keys, error });
            return keys.map(() => null);
        }
    }
    /**
     * Batch set multiple keys
     */
    async mset(entries, options = {}) {
        if (!this.redis || !this.isEnabled) {
            // Fallback to individual sets
            const results = await Promise.all(entries.map(entry => this.set(entry.key, entry.value, { ...options, ttl: entry.ttl })));
            return results.every(result => result);
        }
        try {
            const pipeline = this.redis.pipeline();
            entries.forEach(entry => {
                const fullKey = this.generateKey(entry.key, options.version);
                const ttl = entry.ttl || options.ttl || config_1.config.CACHE_TTL || 3600;
                const compressed = options.compressed !== false ?
                    this.compressData(entry.value) : JSON.stringify(entry.value);
                pipeline.setex(fullKey, ttl, compressed);
            });
            await pipeline.exec();
            return true;
        }
        catch (error) {
            this.stats.errors++;
            logger_1.logger.error('Batch cache set operation failed', { entries: entries.length, error });
            return false;
        }
    }
    /**
     * Clear all cache (use with caution)
     */
    async clear() {
        try {
            if (this.redis && this.isEnabled) {
                await this.redis.flushdb();
            }
            else {
                this.fallbackCache.clear();
            }
            logger_1.logger.info('Cache cleared successfully');
            return true;
        }
        catch (error) {
            this.stats.errors++;
            logger_1.logger.error('Failed to clear cache', { error });
            return false;
        }
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Get cache metrics for monitoring
     */
    getMetrics() {
        const total = this.stats.hits + this.stats.misses;
        return {
            hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
            missRate: total > 0 ? (this.stats.misses / total) * 100 : 0,
            errorRate: total > 0 ? (this.stats.errors / total) * 100 : 0,
            responseTime: 0, // Would need to track average response time
            memoryUsage: this.isEnabled ? this.stats.totalKeys : this.fallbackCache.size,
        };
    }
    /**
     * Health check for cache service
     */
    async healthCheck() {
        try {
            if (!this.isEnabled) {
                return {
                    status: 'degraded',
                    details: {
                        message: 'Using fallback memory cache',
                        fallbackSize: this.fallbackCache.size,
                        redis: false
                    }
                };
            }
            if (!this.redis) {
                return {
                    status: 'unhealthy',
                    details: { message: 'Redis client not initialized' }
                };
            }
            // Test Redis connectivity
            const startTime = Date.now();
            await this.redis.ping();
            const responseTime = Date.now() - startTime;
            const metrics = this.getMetrics();
            let status = 'healthy';
            if (responseTime > 1000 || metrics.errorRate > 5) {
                status = 'degraded';
            }
            if (this.stats.connectionStatus === 'disconnected' || responseTime > 5000) {
                status = 'unhealthy';
            }
            return {
                status,
                details: {
                    responseTime,
                    connectionStatus: this.stats.connectionStatus,
                    metrics,
                    redis: true
                }
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    redis: false
                }
            };
        }
    }
    /**
     * Disconnect and cleanup
     */
    async disconnect() {
        try {
            if (this.redis) {
                await this.redis.quit();
                this.redis = null;
            }
            this.fallbackCache.clear();
            this.isEnabled = false;
            logger_1.logger.info('Cache service disconnected');
        }
        catch (error) {
            logger_1.logger.error('Error during cache service disconnect', { error });
        }
    }
}
// Create and export singleton instance
exports.cacheService = new EnhancedCacheService();
exports.default = exports.cacheService;
// Export specific cache categories for different data types
class SessionCache {
    static async get(sessionId) {
        return exports.cacheService.get(`${this.PREFIX}${sessionId}`, { ttl: this.TTL });
    }
    static async set(sessionId, sessionData) {
        return exports.cacheService.set(`${this.PREFIX}${sessionId}`, sessionData, {
            ttl: this.TTL,
            tags: ['sessions']
        });
    }
    static async delete(sessionId) {
        return exports.cacheService.delete(`${this.PREFIX}${sessionId}`);
    }
    static async invalidateAll() {
        return exports.cacheService.invalidateByTags(['sessions']);
    }
}
exports.SessionCache = SessionCache;
SessionCache.PREFIX = 'session:';
SessionCache.TTL = 24 * 60 * 60; // 24 hours
class StudentCache {
    static async getProfile(studentId) {
        return exports.cacheService.get(`${this.PREFIX}profile:${studentId}`, {
            ttl: this.TTL,
            version: '1.0'
        });
    }
    static async setProfile(studentId, profile) {
        return exports.cacheService.set(`${this.PREFIX}profile:${studentId}`, profile, {
            ttl: this.TTL,
            tags: ['students', `student:${studentId}`],
            version: '1.0'
        });
    }
    static async getProgress(studentId) {
        return exports.cacheService.get(`${this.PREFIX}progress:${studentId}`, {
            ttl: 5 * 60, // 5 minutes for more frequently changing data
            version: '1.0'
        });
    }
    static async setProgress(studentId, progress) {
        return exports.cacheService.set(`${this.PREFIX}progress:${studentId}`, progress, {
            ttl: 5 * 60,
            tags: ['progress', `student:${studentId}`],
            version: '1.0'
        });
    }
    static async invalidateStudent(studentId) {
        return exports.cacheService.invalidateByTags([`student:${studentId}`]);
    }
}
exports.StudentCache = StudentCache;
StudentCache.PREFIX = 'student:';
StudentCache.TTL = 30 * 60; // 30 minutes
class ExerciseCache {
    static async get(exerciseId) {
        return exports.cacheService.get(`${this.PREFIX}${exerciseId}`, {
            ttl: this.TTL,
            version: '1.0'
        });
    }
    static async set(exerciseId, exercise) {
        return exports.cacheService.set(`${this.PREFIX}${exerciseId}`, exercise, {
            ttl: this.TTL,
            tags: ['exercises'],
            version: '1.0'
        });
    }
    static async getList(filters) {
        return exports.cacheService.get(`${this.PREFIX}list:${filters}`, {
            ttl: 15 * 60, // 15 minutes
            version: '1.0'
        });
    }
    static async setList(filters, exercises) {
        return exports.cacheService.set(`${this.PREFIX}list:${filters}`, exercises, {
            ttl: 15 * 60,
            tags: ['exercises'],
            version: '1.0'
        });
    }
    static async invalidateAll() {
        return exports.cacheService.invalidateByTags(['exercises']);
    }
}
exports.ExerciseCache = ExerciseCache;
ExerciseCache.PREFIX = 'exercise:';
ExerciseCache.TTL = 60 * 60; // 1 hour
