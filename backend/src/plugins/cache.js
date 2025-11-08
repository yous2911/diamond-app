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
// src/plugins/cache.ts
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const config_1 = require("../config/config");
const cachePlugin = async (fastify) => {
    let redis = null;
    const memoryCache = new Map();
    const stats = { hits: 0, misses: 0 };
    // Try to connect to Redis if host is configured
    if (config_1.config.REDIS_HOST) {
        try {
            const { Redis } = await Promise.resolve().then(() => __importStar(require('ioredis')));
            redis = new Redis({
                host: config_1.config.REDIS_HOST,
                port: config_1.config.REDIS_PORT || 6379,
                password: config_1.config.REDIS_PASSWORD,
                db: 0, // Default to database 0
                maxRetriesPerRequest: 1, // Only retry once
                lazyConnect: true,
                connectTimeout: 5000, // Reduced timeout
                commandTimeout: 3000, // Reduced timeout
            });
            // Test connection with timeout
            const connectionPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Redis connection timeout'));
                }, 3000);
                redis.once('connect', () => {
                    clearTimeout(timeout);
                    fastify.log.info('Redis connected successfully');
                    resolve(true);
                });
                redis.once('error', (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            });
            await connectionPromise;
            redis.on('error', (error) => {
                fastify.log.warn('Redis connection error, falling back to memory cache:', error.message);
                redis = null; // Fall back to memory cache
            });
            redis.on('close', () => {
                fastify.log.warn('Redis connection closed, using memory cache');
                redis = null;
            });
        }
        catch (error) {
            fastify.log.warn('Redis not available, using memory cache:', error instanceof Error ? error.message : String(error));
            redis = null;
        }
    }
    else {
        fastify.log.info('Redis not configured, using memory-only caching');
    }
    // FIXED: Cache service implementation
    const cache = {
        async get(key) {
            if (redis) {
                try {
                    const value = await redis.get(key);
                    if (value) {
                        stats.hits++;
                        return value;
                    }
                    else {
                        stats.misses++;
                        return null;
                    }
                }
                catch (error) {
                    fastify.log.debug('Redis get error, falling back to memory cache:', error instanceof Error ? error.message : String(error));
                    // Fall through to memory cache
                }
            }
            // Memory cache fallback
            const item = memoryCache.get(key);
            if (item && item.expires > Date.now()) {
                stats.hits++;
                return item.value;
            }
            else {
                if (item)
                    memoryCache.delete(key);
                stats.misses++;
                return null;
            }
        },
        async set(key, value, ttl = 900) {
            if (redis) {
                try {
                    await redis.setex(key, ttl, value);
                    return;
                }
                catch (error) {
                    fastify.log.debug('Redis set error, falling back to memory cache:', error instanceof Error ? error.message : String(error));
                    // Fall through to memory cache
                }
            }
            // Memory cache fallback
            memoryCache.set(key, {
                value,
                expires: Date.now() + (ttl * 1000),
            });
        },
        async del(key) {
            if (redis) {
                try {
                    await redis.del(key);
                    return;
                }
                catch (error) {
                    fastify.log.debug('Redis del error:', error instanceof Error ? error.message : String(error));
                }
            }
            // Memory cache fallback
            memoryCache.delete(key);
        },
        async flush() {
            if (redis) {
                try {
                    await redis.flushdb();
                    return;
                }
                catch (error) {
                    fastify.log.debug('Redis flush error:', error instanceof Error ? error.message : String(error));
                }
            }
            // Memory cache fallback
            memoryCache.clear();
        },
        // ADDED: Missing clear method
        async clear() {
            return this.flush();
        },
        async stats() {
            if (redis) {
                try {
                    const keys = await redis.dbsize();
                    return { ...stats, keys };
                }
                catch (error) {
                    fastify.log.debug('Redis stats error:', error instanceof Error ? error.message : String(error));
                }
            }
            // Memory cache fallback
            return { ...stats, keys: memoryCache.size };
        },
    };
    // FIXED: Decorate with proper typing
    fastify.decorate('cache', cache);
    // Graceful shutdown
    fastify.addHook('onClose', async () => {
        if (redis) {
            try {
                await redis.quit();
                fastify.log.info('Redis connection closed');
            }
            catch (error) {
                fastify.log.warn('Error closing Redis connection:', error instanceof Error ? error.message : String(error));
            }
        }
    });
    fastify.log.info('✅ Cache plugin registered successfully');
};
exports.default = (0, fastify_plugin_1.default)(cachePlugin, { name: 'cache' });
