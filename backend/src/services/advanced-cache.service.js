"use strict";
// ADVANCED CACHING SERVICE
// Multi-tier caching with smart invalidation and performance optimization
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCacheDecorators = exports.AdvancedCacheService = void 0;
class AdvancedCacheService {
    constructor(fastify) {
        this.localCache = new Map();
        this.stats = {
            totalRequests: 0,
            cacheHits: 0,
            cacheMisses: 0,
            hitRatio: 0,
            memoryCacheSize: 0,
            redisCacheSize: 0,
            avgResponseTime: 0,
            hotKeys: []
        };
        this.responseTimeHistory = [];
        this.fastify = fastify;
        this.setupCleanupTasks();
    }
    // TIER 1: SUPER-FAST LOCAL MEMORY CACHE (L1)
    async getFromLocalCache(key) {
        const entry = this.localCache.get(key);
        if (!entry)
            return null;
        const now = Date.now();
        entry.hitCount++;
        entry.lastAccessed = now;
        return entry.data;
    }
    setToLocalCache(key, data, options = {}) {
        const entry = {
            data,
            timestamp: Date.now(),
            version: options.version || '1.0',
            tags: options.tags || [],
            hitCount: 0,
            lastAccessed: Date.now()
        };
        this.localCache.set(key, entry);
        // Limit local cache size (LRU eviction)
        if (this.localCache.size > 1000) {
            this.evictLRU();
        }
    }
    // TIER 2: REDIS DISTRIBUTED CACHE (L2)
    async getFromRedis(key) {
        try {
            const cached = await this.fastify.cache.getJSON(key);
            if (cached) {
                // Promote to L1 cache for faster future access
                this.setToLocalCache(key, cached.data, { tags: cached.tags, version: cached.version });
                return cached.data;
            }
            return null;
        }
        catch (error) {
            this.fastify.log.warn('Redis get error:', error);
            return null;
        }
    }
    async setToRedis(key, data, options = {}) {
        try {
            const entry = {
                data,
                timestamp: Date.now(),
                version: options.version || '1.0',
                tags: options.tags || [],
                hitCount: 0,
                lastAccessed: Date.now()
            };
            await this.fastify.cache.setJSON(key, entry, options.ttl);
        }
        catch (error) {
            this.fastify.log.warn('Redis set error:', error);
        }
    }
    // SMART CACHE RETRIEVAL WITH FALLBACK
    async get(key, options = {}) {
        const startTime = Date.now();
        this.stats.totalRequests++;
        const prefixedKey = options.prefix ? `${options.prefix}:${key}` : key;
        try {
            // TIER 1: Check local memory cache first (fastest)
            let data = await this.getFromLocalCache(prefixedKey);
            if (data !== null) {
                this.recordCacheHit(startTime);
                return data;
            }
            // TIER 2: Check Redis cache
            data = await this.getFromRedis(prefixedKey);
            if (data !== null) {
                this.recordCacheHit(startTime);
                return data;
            }
            // TIER 3: Execute fallback function if provided
            if (options.fallback) {
                this.fastify.log.debug('Cache miss, executing fallback for key:', prefixedKey);
                data = await options.fallback();
                if (data !== null) {
                    // Cache the result with smart TTL
                    const smartTTL = this.calculateSmartTTL(key, options.ttl);
                    await this.set(key, data, { ...options, ttl: smartTTL });
                }
                this.recordCacheMiss(startTime);
                return data;
            }
            this.recordCacheMiss(startTime);
            return null;
        }
        catch (error) {
            this.fastify.log.error('Cache get error:', { key: prefixedKey, error });
            this.recordCacheMiss(startTime);
            return null;
        }
    }
    // SMART CACHE STORAGE
    async set(key, data, options = {}) {
        const prefixedKey = options.prefix ? `${options.prefix}:${key}` : key;
        try {
            // Store in both tiers for maximum performance
            this.setToLocalCache(prefixedKey, data, options);
            await this.setToRedis(prefixedKey, data, options);
            this.fastify.log.debug('Data cached successfully:', {
                key: prefixedKey,
                ttl: options.ttl,
                tags: options.tags
            });
        }
        catch (error) {
            this.fastify.log.error('Cache set error:', { key: prefixedKey, error });
        }
    }
    // BATCH OPERATIONS FOR PERFORMANCE
    async mget(keys, options = {}) {
        const startTime = Date.now();
        const prefixedKeys = keys.map(key => options.prefix ? `${options.prefix}:${key}` : key);
        try {
            // Check local cache first
            const localResults = prefixedKeys.map(key => this.getFromLocalCache(key));
            const localData = await Promise.all(localResults);
            // Identify missing keys for Redis lookup
            const missingIndices = [];
            const missingKeys = [];
            localData.forEach((data, index) => {
                if (data === null) {
                    missingIndices.push(index);
                    missingKeys.push(prefixedKeys[index]);
                }
            });
            // Fetch missing data from Redis
            if (missingKeys.length > 0) {
                const redisResults = await this.fastify.cache.mget(missingKeys);
                missingIndices.forEach((originalIndex, redisIndex) => {
                    const redisData = redisResults[redisIndex];
                    if (redisData) {
                        try {
                            const parsed = JSON.parse(redisData);
                            localData[originalIndex] = parsed.data;
                            // Promote to L1 cache
                            this.setToLocalCache(prefixedKeys[originalIndex], parsed.data, options);
                        }
                        catch (error) {
                            this.fastify.log.warn('JSON parse error in mget:', error);
                        }
                    }
                });
            }
            const hitCount = localData.filter(d => d !== null).length;
            this.stats.cacheHits += hitCount;
            this.stats.cacheMisses += (keys.length - hitCount);
            this.recordResponseTime(startTime);
            return localData;
        }
        catch (error) {
            this.fastify.log.error('Cache mget error:', { keys: prefixedKeys, error });
            return new Array(keys.length).fill(null);
        }
    }
    // INTELLIGENT CACHE INVALIDATION
    async invalidateByTags(tags) {
        try {
            // Invalidate local cache
            for (const [key, entry] of this.localCache.entries()) {
                if (entry.tags.some(tag => tags.includes(tag))) {
                    this.localCache.delete(key);
                }
            }
            // Invalidate Redis cache by pattern matching
            for (const tag of tags) {
                const pattern = `*${tag}*`;
                const keys = await this.fastify.cache.keys(pattern);
                if (keys.length > 0) {
                    await this.fastify.cache.del(keys);
                }
            }
            this.fastify.log.info('Cache invalidated by tags:', tags);
        }
        catch (error) {
            this.fastify.log.error('Cache invalidation error:', { tags, error });
        }
    }
    // CACHE WARMING FOR CRITICAL DATA
    async warmCache(warmingStrategies) {
        this.fastify.log.info('Starting cache warming...', { strategies: warmingStrategies.length });
        const warmingPromises = warmingStrategies.map(async ({ key, data, options }) => {
            try {
                await this.set(key, data, options);
                return { key, success: true };
            }
            catch (error) {
                this.fastify.log.warn('Cache warming failed for key:', { key, error });
                return { key, success: false, error };
            }
        });
        const results = await Promise.allSettled(warmingPromises);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        this.fastify.log.info('Cache warming completed:', {
            total: warmingStrategies.length,
            successful
        });
    }
    // PERFORMANCE MONITORING AND OPTIMIZATION
    getStats() {
        this.updateHotKeys();
        return {
            ...this.stats,
            hitRatio: this.stats.totalRequests > 0
                ? (this.stats.cacheHits / this.stats.totalRequests) * 100
                : 0,
            memoryCacheSize: this.localCache.size,
            avgResponseTime: this.responseTimeHistory.length > 0
                ? this.responseTimeHistory.reduce((a, b) => a + b, 0) / this.responseTimeHistory.length
                : 0
        };
    }
    // CACHE OPTIMIZATION RECOMMENDATIONS
    getOptimizationRecommendations() {
        const stats = this.getStats();
        const recommendations = [];
        if (stats.hitRatio < 70) {
            recommendations.push({
                type: 'hit_ratio',
                message: `Cache hit ratio is ${stats.hitRatio.toFixed(1)}%. Consider increasing TTL or cache warming.`,
                priority: 'high'
            });
        }
        if (stats.avgResponseTime > 100) {
            recommendations.push({
                type: 'response_time',
                message: `Average cache response time is ${stats.avgResponseTime.toFixed(1)}ms. Consider optimizing serialization.`,
                priority: 'medium'
            });
        }
        if (stats.memoryCacheSize > 800) {
            recommendations.push({
                type: 'memory_usage',
                message: `Local cache size is ${stats.memoryCacheSize} entries. Consider reducing local cache limit.`,
                priority: 'medium'
            });
        }
        return recommendations;
    }
    // PRIVATE HELPER METHODS
    calculateSmartTTL(key, defaultTTL) {
        // Smart TTL calculation based on key patterns and usage
        const baseTTL = defaultTTL || 3600; // 1 hour default
        if (key.includes('user:') || key.includes('session:')) {
            return baseTTL * 0.5; // Shorter TTL for user data
        }
        if (key.includes('static:') || key.includes('config:')) {
            return baseTTL * 24; // Longer TTL for static data
        }
        if (key.includes('exercise:') || key.includes('competence:')) {
            return baseTTL * 6; // Moderate TTL for educational content
        }
        return baseTTL;
    }
    evictLRU() {
        // Remove least recently used entries
        const entries = Array.from(this.localCache.entries());
        entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        const toEvict = entries.slice(0, 100); // Remove oldest 100 entries
        toEvict.forEach(([key]) => this.localCache.delete(key));
        this.fastify.log.debug('Evicted LRU entries from local cache:', toEvict.length);
    }
    recordCacheHit(startTime) {
        this.stats.cacheHits++;
        this.recordResponseTime(startTime);
    }
    recordCacheMiss(startTime) {
        this.stats.cacheMisses++;
        this.recordResponseTime(startTime);
    }
    recordResponseTime(startTime) {
        const responseTime = Date.now() - startTime;
        this.responseTimeHistory.push(responseTime);
        // Keep only last 1000 response times
        if (this.responseTimeHistory.length > 1000) {
            this.responseTimeHistory.shift();
        }
    }
    updateHotKeys() {
        const entries = Array.from(this.localCache.entries());
        this.stats.hotKeys = entries
            .map(([key, entry]) => ({
            key,
            hits: entry.hitCount,
            lastAccessed: entry.lastAccessed
        }))
            .sort((a, b) => b.hits - a.hits)
            .slice(0, 10);
    }
    setupCleanupTasks() {
        // Cleanup expired local cache entries every 5 minutes
        setInterval(() => {
            const now = Date.now();
            let cleanedCount = 0;
            for (const [key, entry] of this.localCache.entries()) {
                // Remove entries older than 1 hour that haven't been accessed recently
                if (now - entry.lastAccessed > 3600000) {
                    this.localCache.delete(key);
                    cleanedCount++;
                }
            }
            if (cleanedCount > 0) {
                this.fastify.log.debug('Cleaned up expired local cache entries:', cleanedCount);
            }
        }, 300000); // 5 minutes
        // Reset stats periodically to prevent memory growth
        setInterval(() => {
            this.responseTimeHistory = this.responseTimeHistory.slice(-500);
        }, 3600000); // 1 hour
    }
}
exports.AdvancedCacheService = AdvancedCacheService;
// CACHE DECORATORS FOR EASY INTEGRATION
function createCacheDecorators(advancedCache) {
    return {
        // Decorator for caching function results
        cached: (options = {}) => {
            return (target, propertyKey, descriptor) => {
                const originalMethod = descriptor.value;
                descriptor.value = async function (...args) {
                    const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
                    const cachedResult = await advancedCache.get(cacheKey, {
                        ...options,
                        fallback: () => originalMethod.apply(this, args)
                    });
                    return cachedResult;
                };
                return descriptor;
            };
        },
        // Decorator for invalidating cache on method execution
        invalidateCache: (tags) => {
            return (target, propertyKey, descriptor) => {
                const originalMethod = descriptor.value;
                descriptor.value = async function (...args) {
                    const result = await originalMethod.apply(this, args);
                    await advancedCache.invalidateByTags(tags);
                    return result;
                };
                return descriptor;
            };
        }
    };
}
exports.createCacheDecorators = createCacheDecorators;
