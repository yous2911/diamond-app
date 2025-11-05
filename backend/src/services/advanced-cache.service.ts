// ADVANCED CACHING SERVICE
// Multi-tier caching with smart invalidation and performance optimization

import { FastifyInstance } from 'fastify';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  version: string;
  tags: string[];
  hitCount: number;
  lastAccessed: number;
}

interface CacheOptions {
  ttl?: number;
  tags?: string[];
  version?: string;
  prefix?: string;
  serialize?: boolean;
  compress?: boolean;
  fallback?: () => Promise<any>;
}

interface CacheStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  hitRatio: number;
  memoryCacheSize: number;
  redisCacheSize: number;
  avgResponseTime: number;
  hotKeys: Array<{ key: string; hits: number; lastAccessed: number }>;
}

export class AdvancedCacheService {
  private fastify: FastifyInstance;
  private localCache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    hitRatio: 0,
    memoryCacheSize: 0,
    redisCacheSize: 0,
    avgResponseTime: 0,
    hotKeys: []
  };
  private responseTimeHistory: number[] = [];

  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    this.setupCleanupTasks();
  }

  // TIER 1: SUPER-FAST LOCAL MEMORY CACHE (L1)
  private async getFromLocalCache<T>(key: string): Promise<T | null> {
    const entry = this.localCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    entry.hitCount++;
    entry.lastAccessed = now;

    return entry.data;
  }

  private setToLocalCache<T>(key: string, data: T, options: CacheOptions = {}): void {
    const entry: CacheEntry<T> = {
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
  private async getFromRedis<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.fastify.cache.getJSON<CacheEntry<T>>(key);
      if (cached) {
        // Promote to L1 cache for faster future access
        this.setToLocalCache(key, cached.data, { tags: cached.tags, version: cached.version });
        return cached.data;
      }
      return null;
    } catch (error) {
      this.fastify.log.warn('Redis get error:', error);
      return null;
    }
  }

  private async setToRedis<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: options.version || '1.0',
        tags: options.tags || [],
        hitCount: 0,
        lastAccessed: Date.now()
      };

      await this.fastify.cache.setJSON(key, entry, options.ttl);
    } catch (error) {
      this.fastify.log.warn('Redis set error:', error);
    }
  }

  // SMART CACHE RETRIEVAL WITH FALLBACK
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    const prefixedKey = options.prefix ? `${options.prefix}:${key}` : key;

    try {
      // TIER 1: Check local memory cache first (fastest)
      let data = await this.getFromLocalCache<T>(prefixedKey);
      if (data !== null) {
        this.recordCacheHit(startTime);
        return data;
      }

      // TIER 2: Check Redis cache
      data = await this.getFromRedis<T>(prefixedKey);
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

    } catch (error) {
      this.fastify.log.error('Cache get error:', { key: prefixedKey, error });
      this.recordCacheMiss(startTime);
      return null;
    }
  }

  // SMART CACHE STORAGE
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
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

    } catch (error) {
      this.fastify.log.error('Cache set error:', { key: prefixedKey, error });
    }
  }

  // BATCH OPERATIONS FOR PERFORMANCE
  async mget<T>(keys: string[], options: CacheOptions = {}): Promise<Array<T | null>> {
    const startTime = Date.now();
    const prefixedKeys = keys.map(key => options.prefix ? `${options.prefix}:${key}` : key);

    try {
      // Check local cache first
      const localResults = prefixedKeys.map(key => this.getFromLocalCache<T>(key));
      const localData = await Promise.all(localResults);

      // Identify missing keys for Redis lookup
      const missingIndices: number[] = [];
      const missingKeys: string[] = [];

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
              const parsed = JSON.parse(redisData) as CacheEntry<T>;
              localData[originalIndex] = parsed.data;
              // Promote to L1 cache
              this.setToLocalCache(prefixedKeys[originalIndex], parsed.data, options);
            } catch (error) {
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

    } catch (error) {
      this.fastify.log.error('Cache mget error:', { keys: prefixedKeys, error });
      return new Array(keys.length).fill(null);
    }
  }

  // INTELLIGENT CACHE INVALIDATION
  async invalidateByTags(tags: string[]): Promise<void> {
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

    } catch (error) {
      this.fastify.log.error('Cache invalidation error:', { tags, error });
    }
  }

  // CACHE WARMING FOR CRITICAL DATA
  async warmCache(warmingStrategies: Array<{ key: string; data: any; options?: CacheOptions }>): Promise<void> {
    this.fastify.log.info('Starting cache warming...', { strategies: warmingStrategies.length });

    const warmingPromises = warmingStrategies.map(async ({ key, data, options }) => {
      try {
        await this.set(key, data, options);
        return { key, success: true };
      } catch (error) {
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
  getStats(): CacheStats {
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
  getOptimizationRecommendations(): Array<{ type: string; message: string; priority: 'low' | 'medium' | 'high' }> {
    const stats = this.getStats();
    const recommendations: Array<{ type: string; message: string; priority: 'low' | 'medium' | 'high' }> = [];

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
  private calculateSmartTTL(key: string, defaultTTL?: number): number {
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

  private evictLRU(): void {
    // Remove least recently used entries
    const entries = Array.from(this.localCache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    const toEvict = entries.slice(0, 100); // Remove oldest 100 entries
    toEvict.forEach(([key]) => this.localCache.delete(key));

    this.fastify.log.debug('Evicted LRU entries from local cache:', toEvict.length);
  }

  private recordCacheHit(startTime: number): void {
    this.stats.cacheHits++;
    this.recordResponseTime(startTime);
  }

  private recordCacheMiss(startTime: number): void {
    this.stats.cacheMisses++;
    this.recordResponseTime(startTime);
  }

  private recordResponseTime(startTime: number): void {
    const responseTime = Date.now() - startTime;
    this.responseTimeHistory.push(responseTime);

    // Keep only last 1000 response times
    if (this.responseTimeHistory.length > 1000) {
      this.responseTimeHistory.shift();
    }
  }

  private updateHotKeys(): void {
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

  private setupCleanupTasks(): void {
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

// CACHE DECORATORS FOR EASY INTEGRATION
export function createCacheDecorators(advancedCache: AdvancedCacheService) {
  return {
    // Decorator for caching function results
    cached: (options: CacheOptions = {}) => {
      return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
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
    invalidateCache: (tags: string[]) => {
      return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
          const result = await originalMethod.apply(this, args);
          await advancedCache.invalidateByTags(tags);
          return result;
        };

        return descriptor;
      };
    }
  };
}