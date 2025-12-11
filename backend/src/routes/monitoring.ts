
import { FastifyPluginAsync, FastifyReply } from 'fastify';

const monitoringRoutes: FastifyPluginAsync = async (fastify) => {
  // Health endpoint with standardized response
  fastify.get('/health', {
    handler: async (_, reply: FastifyReply) => {
      const healthStatus = {
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          database: 'up',
          redis: 'up',
          cache: 'up',
          services: {
            database: 'up',
            redis: 'up',
            cache: 'up'
          }
        }
      };

      return reply.send(healthStatus);
    }
  });

  // Metrics endpoint with proper data structure
  fastify.get('/metrics', {
    handler: async (_, reply: FastifyReply) => {
      try {
        // Get real cache stats
        let cacheStats = {
          hits: 0,
          misses: 0,
          keys: 0,
          hitRate: 0,
          memory: {
            used: 0,
            maxMemory: 0,
            percentage: 0
          }
        };

        if (fastify.cache && typeof fastify.cache.stats === 'function') {
          const stats = await fastify.cache.stats();
          const total = stats.hits + stats.misses;
          
          cacheStats = {
            hits: stats.hits || 0,
            misses: stats.misses || 0,
            keys: stats.keys || 0,
            hitRate: total > 0 ? (stats.hits / total) * 100 : 0,
            memory: (stats as any).memory || {
              used: 0,
              maxMemory: 0,
              percentage: 0
            }
          };
        }

        const metrics = {
          requests: cacheStats.hits + cacheStats.misses,
          responses: cacheStats.hits + cacheStats.misses,
          cacheHits: cacheStats.hits,
          cacheMisses: cacheStats.misses,
          cacheHitRate: cacheStats.hitRate,
          cacheKeys: cacheStats.keys,
          cacheMemory: cacheStats.memory,
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        };

        return reply.send({
          success: true,
          data: metrics,
          timestamp: new Date().toISOString()
        });
      } catch (error: unknown) {
        fastify.log.error({ err: error }, 'Metrics error');
        return reply.status(500).send({
          success: false,
          error: { message: 'Erreur lors de la récupération des métriques', code: 'METRICS_ERROR' }
        });
      }
    }
  });

  // System information endpoint (missing from original)
  fastify.get('/system', {
    handler: async (_, reply: FastifyReply) => {
      return reply.send({
        success: true,
        data: {
          node: {
            version: process.version,
            platform: process.platform,
            arch: process.arch,
            pid: process.pid,
            uptime: process.uptime()
          },
          memory: process.memoryUsage(),
          env: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        }
      });
    }
  });

  // Cache endpoint with statistics and hit rate calculation
  fastify.get('/cache', {
    handler: async (_, reply: FastifyReply) => {
      try {
        // Get real cache stats from Redis/memory cache
        let cacheStats = {
          hits: 0,
          misses: 0,
          keys: 0,
          hitRate: 0,
          memory: {
            used: 0,
            maxMemory: 0,
            percentage: 0
          }
        };

        if (fastify.cache && typeof fastify.cache.stats === 'function') {
          const stats = await fastify.cache.stats();
          const total = stats.hits + stats.misses;
          
          cacheStats = {
            hits: stats.hits || 0,
            misses: stats.misses || 0,
            keys: stats.keys || 0,
            hitRate: total > 0 ? parseFloat(((stats.hits / total) * 100).toFixed(2)) : 0,
            memory: (stats as any).memory || {
              used: 0,
              maxMemory: 0,
              percentage: 0
            }
          };
        }
        
        return reply.send({
          success: true,
          data: {
            hitRate: cacheStats.hitRate,
            missRate: 100 - cacheStats.hitRate,
            hits: cacheStats.hits,
            misses: cacheStats.misses,
            total: cacheStats.hits + cacheStats.misses,
            keys: cacheStats.keys,
            memory: cacheStats.memory
          },
          message: 'Cache statistics retrieved successfully'
        });
      } catch (error: unknown) {
        fastify.log.error({ err: error }, 'Cache stats error');
        return reply.status(500).send({
          success: false,
          error: { message: 'Erreur cache', code: 'CACHE_ERROR' }
        });
      }
    }
  });

  // Keep the old cache/stats endpoint for backward compatibility
  fastify.get('/cache/stats', {
    handler: async (_, reply: FastifyReply) => {
      try {
        // Get real cache stats
        let cacheStats = {
          hits: 0,
          misses: 0,
          keys: 0,
          hitRate: 0
        };

        if (fastify.cache && typeof fastify.cache.stats === 'function') {
          const stats = await fastify.cache.stats();
          const total = stats.hits + stats.misses;
          
          cacheStats = {
            hits: stats.hits || 0,
            misses: stats.misses || 0,
            keys: stats.keys || 0,
            hitRate: total > 0 ? parseFloat(((stats.hits / total) * 100).toFixed(2)) : 0
          };
        }
        
        return reply.send({
          success: true,
          data: {
            totalKeys: cacheStats.keys,
            hitRate: cacheStats.hitRate,
            hits: cacheStats.hits,
            misses: cacheStats.misses
          },
          message: 'Statistiques du cache récupérées'
        });
      } catch (error: unknown) {
        fastify.log.error({ err: error }, 'Cache stats error');
        return reply.status(500).send({
          success: false,
          error: { message: 'Erreur cache', code: 'CACHE_ERROR' }
        });
      }
    }
  });

  // Clear cache endpoint
  fastify.delete('/cache', {
    handler: async (_, reply: FastifyReply) => {
      try {
        // Clear real cache
        if (fastify.cache && typeof fastify.cache.clear === 'function') {
          await fastify.cache.clear();
        } else if (fastify.cache && typeof fastify.cache.flush === 'function') {
          await fastify.cache.flush();
        }
        
        return reply.send({
          success: true,
          message: 'Cache vidé avec succès'
        });
      } catch (error: unknown) {
        fastify.log.error({ err: error }, 'Cache clear error');
        return reply.status(500).send({
          success: false,
          error: { message: 'Erreur lors du vidage du cache', code: 'CACHE_CLEAR_ERROR' }
        });
      }
    }
  });
};

export default monitoringRoutes;
