// src/plugins/cache.ts
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { config } from '../config/config';

// FIXED: Cache service interface that matches type declarations
interface CacheService {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ttl?: number) => Promise<void>;
  del: (key: string) => Promise<void>;
  flush: () => Promise<void>;
  stats: () => Promise<{ hits: number; misses: number; keys: number }>;
  clear: () => Promise<void>; // ADDED: Missing method
}

const cachePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  let redis: any = null;
  const memoryCache = new Map<string, { value: string; expires: number }>();
  const stats = { hits: 0, misses: 0 };

  // Try to connect to Redis if enabled
  if (config.REDIS_ENABLED === true || String(config.REDIS_ENABLED) === 'true') {
    try {
      const { Redis } = await import('ioredis');
      redis = new Redis({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT || 6379,
        password: config.REDIS_PASSWORD,
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
          (fastify.log as any).info('Redis connected successfully');
          resolve(true);
        });

        redis.once('error', (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      await connectionPromise;

      redis.on('error', (error: Error) => {
        ((fastify.log as any) as any).warn('Redis connection error, falling back to memory cache:', error.message);
        redis = null; // Fall back to memory cache
      });

      redis.on('close', () => {
        ((fastify.log as any) as any).warn('Redis connection closed, using memory cache');
        redis = null;
      });

    } catch (error: unknown) {
      (fastify.log as any).warn('Redis not available, using memory cache:', error instanceof Error ? error.message : String(error));
      redis = null;
    }
  } else {
    (fastify.log as any).info('Redis not configured, using memory-only caching');
  }

  // FIXED: Cache service implementation
  const cache: CacheService = {
    async get(key: string): Promise<string | null> {
      if (redis) {
        try {
          const value = await redis.get(key);
          if (value) {
            stats.hits++;
            return value;
          } else {
            stats.misses++;
            return null;
          }
        } catch (error: unknown) {
          (fastify.log as any).debug('Redis get error, falling back to memory cache:', error instanceof Error ? error.message : String(error));
          // Fall through to memory cache
        }
      }

      // Memory cache fallback
      const item = memoryCache.get(key);
      if (item && item.expires > Date.now()) {
        stats.hits++;
        return item.value;
      } else {
        if (item) memoryCache.delete(key);
        stats.misses++;
        return null;
      }
    },

    async set(key: string, value: string, ttl: number = 900): Promise<void> {
      if (redis) {
        try {
          await redis.setex(key, ttl, value);
          return;
        } catch (error: unknown) {
          (fastify.log as any).debug('Redis set error, falling back to memory cache:', error instanceof Error ? error.message : String(error));
          // Fall through to memory cache
        }
      }

      // Memory cache fallback
      memoryCache.set(key, {
        value,
        expires: Date.now() + (ttl * 1000),
      });
    },

    async del(key: string): Promise<void> {
      if (redis) {
        try {
          await redis.del(key);
          return;
        } catch (error: unknown) {
          (fastify.log as any).debug('Redis del error:', error instanceof Error ? error.message : String(error));
        }
      }

      // Memory cache fallback
      memoryCache.delete(key);
    },

    async flush(): Promise<void> {
      if (redis) {
        try {
          await redis.flushdb();
          return;
        } catch (error: unknown) {
          (fastify.log as any).debug('Redis flush error:', error instanceof Error ? error.message : String(error));
        }
      }

      // Memory cache fallback
      memoryCache.clear();
    },

    // ADDED: Missing clear method
    async clear(): Promise<void> {
      return this.flush();
    },

    async stats(): Promise<{ hits: number; misses: number; keys: number }> {
      if (redis) {
        try {
          const keys = await redis.dbsize();
          return { ...stats, keys };
        } catch (error: unknown) {
          (fastify.log as any).debug('Redis stats error:', error instanceof Error ? error.message : String(error));
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
        (fastify.log as any).info('Redis connection closed');
      } catch (error: unknown) {
        (fastify.log as any).warn('Error closing Redis connection:', error instanceof Error ? error.message : String(error));
      }
    }
  });

  (fastify.log as any).info('✅ Cache plugin registered successfully');
};

export default fp(cachePlugin, { name: 'cache' });
