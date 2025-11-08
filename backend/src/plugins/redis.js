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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const Redis = __importStar(require("ioredis"));
const config_1 = require("../config/config");
exports.redis = null;
const redisPlugin = async (fastify) => {
    const logger = fastify.log;
    let isRedisAvailable = false;
    // Fallback memory cache
    const memoryCache = new Map();
    const stats = {
        hits: 0,
        misses: 0,
        keys: 0,
        operations: {
            gets: 0,
            sets: 0,
            dels: 0,
            errors: 0
        }
    };
    // Try to connect to Redis if enabled
    if (config_1.config.REDIS_ENABLED) {
        try {
            fastify.log.info('Attempting Redis connection...', {
                host: config_1.redisConfig.host,
                port: config_1.redisConfig.port,
                db: config_1.redisConfig.db
            });
            exports.redis = new Redis.default({
                host: config_1.redisConfig.host,
                port: config_1.redisConfig.port,
                password: config_1.redisConfig.password || undefined,
                db: config_1.redisConfig.db,
                // retryDelayOnFailover removed - not supported in current Redis version
                maxRetriesPerRequest: config_1.redisConfig.maxRetriesPerRequest,
                lazyConnect: config_1.redisConfig.lazyConnect,
                showFriendlyErrorStack: config_1.redisConfig.showFriendlyErrorStack,
                connectTimeout: config_1.redisConfig.connectTimeout,
                commandTimeout: config_1.redisConfig.commandTimeout,
                // Connection retry configuration
                retryStrategy: (times) => {
                    if (times > 3) {
                        fastify.log.error('Redis connection failed after 3 retries, falling back to memory cache');
                        return null; // Stop retrying
                    }
                    const delay = Math.min(times * 50, 2000);
                    fastify.log.warn(`Redis connection retry ${times} in ${delay}ms`);
                    return delay;
                }
            });
            // Event handlers
            exports.redis.on('ready', () => {
                isRedisAvailable = true;
                fastify.log.info('Redis connection established successfully');
            });
            exports.redis.on('error', (error) => {
                isRedisAvailable = false;
                stats.operations.errors++;
                fastify.log.warn('Redis connection error, falling back to memory cache:', {
                    error: error.message
                });
            });
            exports.redis.on('close', () => {
                isRedisAvailable = false;
                fastify.log.warn('Redis connection closed, using memory cache');
            });
            // Test connection
            await exports.redis.ping();
            isRedisAvailable = true;
            fastify.log.info('✅ Redis connected successfully');
        }
        catch (error) {
            fastify.log.warn('Redis connection failed, using memory cache fallback:', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            isRedisAvailable = false;
            exports.redis = null;
        }
    }
    else {
        fastify.log.info('Redis disabled - using memory cache only');
    }
    // Unified cache interface that works with Redis or memory
    const cache = {
        async get(key) {
            stats.operations.gets++;
            try {
                if (exports.redis && isRedisAvailable) {
                    const value = await exports.redis.get(key);
                    if (value !== null) {
                        stats.hits++;
                        return value;
                    }
                    stats.misses++;
                    return null;
                }
            }
            catch (error) {
                stats.operations.errors++;
                fastify.log.warn('Redis get error, falling back to memory cache:', {
                    key,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
            // Memory cache fallback
            const item = memoryCache.get(key);
            if (item && item.expiry > Date.now()) {
                stats.hits++;
                return item.value;
            }
            else if (item) {
                memoryCache.delete(key);
            }
            stats.misses++;
            return null;
        },
        async set(key, value, ttl) {
            stats.operations.sets++;
            const actualTtl = ttl || config_1.config.CACHE_TTL;
            try {
                if (exports.redis && isRedisAvailable) {
                    await exports.redis.setex(key, actualTtl, value);
                    return;
                }
            }
            catch (error) {
                stats.operations.errors++;
                fastify.log.warn('Redis set error, falling back to memory cache:', {
                    key,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
            // Memory cache fallback
            memoryCache.set(key, {
                value,
                expiry: Date.now() + actualTtl * 1000
            });
        },
        async mget(keys) {
            if (keys.length === 0)
                return [];
            try {
                if (exports.redis && isRedisAvailable) {
                    const values = await exports.redis.mget(...keys);
                    return values;
                }
            }
            catch (error) {
                stats.operations.errors++;
                fastify.log.warn('Redis mget error:', error);
            }
            // Memory cache fallback
            return keys.map(key => {
                const item = memoryCache.get(key);
                return item && item.expiry > Date.now() ? item.value : null;
            });
        },
        async mset(data, ttl) {
            const actualTtl = ttl || config_1.config.CACHE_TTL;
            try {
                if (exports.redis && isRedisAvailable) {
                    const pipeline = exports.redis.pipeline();
                    for (const [key, value] of Object.entries(data)) {
                        pipeline.setex(key, actualTtl, value);
                    }
                    await pipeline.exec();
                    return;
                }
            }
            catch (error) {
                stats.operations.errors++;
                fastify.log.warn('Redis mset error:', error);
            }
            // Memory cache fallback
            const expiry = Date.now() + actualTtl * 1000;
            for (const [key, value] of Object.entries(data)) {
                memoryCache.set(key, { value, expiry });
            }
        },
        async del(key) {
            stats.operations.dels++;
            const keys = Array.isArray(key) ? key : [key];
            try {
                if (exports.redis && isRedisAvailable) {
                    return await exports.redis.del(...keys);
                }
            }
            catch (error) {
                stats.operations.errors++;
                fastify.log.warn('Redis del error:', error);
            }
            // Memory cache fallback
            let deletedCount = 0;
            for (const k of keys) {
                if (memoryCache.delete(k)) {
                    deletedCount++;
                }
            }
            return deletedCount;
        },
        async exists(key) {
            try {
                if (exports.redis && isRedisAvailable) {
                    return await exports.redis.exists(key);
                }
            }
            catch (error) {
                stats.operations.errors++;
                fastify.log.warn('Redis exists error:', error);
            }
            // Memory cache fallback
            const item = memoryCache.get(key);
            return item && item.expiry > Date.now() ? 1 : 0;
        },
        async expire(key, ttl) {
            try {
                if (exports.redis && isRedisAvailable) {
                    return await exports.redis.expire(key, ttl);
                }
            }
            catch (error) {
                stats.operations.errors++;
                fastify.log.warn('Redis expire error:', error);
            }
            // Memory cache fallback
            const item = memoryCache.get(key);
            if (item) {
                item.expiry = Date.now() + ttl * 1000;
                return 1;
            }
            return 0;
        },
        async incr(key, ttl) {
            try {
                if (exports.redis && isRedisAvailable) {
                    const value = await exports.redis.incr(key);
                    if (ttl && value === 1) {
                        await exports.redis.expire(key, ttl);
                    }
                    return value;
                }
            }
            catch (error) {
                stats.operations.errors++;
                fastify.log.warn('Redis incr error:', error);
            }
            // Memory cache fallback
            const item = memoryCache.get(key);
            const currentValue = item ? parseInt(item.value, 10) || 0 : 0;
            const newValue = currentValue + 1;
            const expiry = ttl ? Date.now() + ttl * 1000 : (item ? item.expiry : Date.now() + config_1.config.CACHE_TTL * 1000);
            memoryCache.set(key, { value: newValue.toString(), expiry });
            return newValue;
        },
        async flush() {
            try {
                if (exports.redis && isRedisAvailable) {
                    await exports.redis.flushdb();
                }
            }
            catch (error) {
                stats.operations.errors++;
                fastify.log.warn('Redis flush error:', error);
            }
            // Clear memory cache
            memoryCache.clear();
        },
        async keys(pattern) {
            try {
                if (exports.redis && isRedisAvailable) {
                    return await exports.redis.keys(pattern);
                }
            }
            catch (error) {
                stats.operations.errors++;
                fastify.log.warn('Redis keys error:', error);
            }
            // Memory cache fallback - simple pattern matching
            const keys = Array.from(memoryCache.keys());
            if (pattern === '*')
                return keys;
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return keys.filter(key => regex.test(key));
        },
        async ping() {
            try {
                if (exports.redis && isRedisAvailable) {
                    return await exports.redis.ping();
                }
            }
            catch (error) {
                fastify.log.warn('Redis ping error:', error);
            }
            return 'PONG (memory cache)';
        },
        async info() {
            try {
                if (exports.redis && isRedisAvailable) {
                    const info = await exports.redis.info('memory');
                    return { redis: true, info };
                }
            }
            catch (error) {
                fastify.log.warn('Redis info error:', error);
            }
            return {
                redis: false,
                memoryCache: {
                    size: memoryCache.size,
                    type: 'in-memory'
                }
            };
        },
        async stats() {
            const baseStats = { ...stats, keys: memoryCache.size };
            try {
                if (exports.redis && isRedisAvailable) {
                    const info = await exports.redis.info('memory');
                    const lines = info.split('\r\n');
                    const memory = {};
                    for (const line of lines) {
                        const [key, value] = line.split(':');
                        if (key && value) {
                            memory[key] = value;
                        }
                    }
                    baseStats.memory = {
                        used: parseInt(memory.used_memory) || 0,
                        maxMemory: parseInt(memory.maxmemory) || 0,
                        percentage: memory.maxmemory
                            ? Math.round((parseInt(memory.used_memory) / parseInt(memory.maxmemory)) * 100)
                            : 0
                    };
                    const keyCount = await exports.redis.dbsize();
                    baseStats.keys = keyCount;
                }
            }
            catch (error) {
                fastify.log.warn('Redis stats error:', error);
            }
            return baseStats;
        },
        async setJSON(key, value, ttl) {
            await this.set(key, JSON.stringify(value), ttl);
        },
        async getJSON(key) {
            const value = await this.get(key);
            if (!value)
                return null;
            try {
                return JSON.parse(value);
            }
            catch (error) {
                fastify.log.warn('JSON parse error for cache key:', { key, error });
                return null;
            }
        }
    };
    // Cleanup expired memory cache entries periodically
    const cleanupInterval = setInterval(() => {
        const now = Date.now();
        let expiredCount = 0;
        Array.from(memoryCache.entries()).forEach(([key, item]) => {
            if (item.expiry <= now) {
                memoryCache.delete(key);
                expiredCount++;
            }
        });
        if (expiredCount > 0) {
            fastify.log.debug(`Cleaned up ${expiredCount} expired memory cache entries`);
        }
    }, 60000); // Every minute
    // Decorate fastify with cache interface
    fastify.decorate('cache', cache);
    fastify.decorate('redis', exports.redis);
    // Graceful shutdown
    fastify.addHook('onClose', async () => {
        clearInterval(cleanupInterval);
        if (exports.redis && isRedisAvailable) {
            await exports.redis.quit();
            fastify.log.info('Redis connection closed');
        }
    });
    fastify.log.info(`✅ Cache plugin registered successfully (Redis: ${isRedisAvailable ? 'enabled' : 'disabled'})`);
};
exports.default = (0, fastify_plugin_1.default)(redisPlugin, { name: 'cache' });
