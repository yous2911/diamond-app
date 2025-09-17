// src/plugins/rate-limit.ts - Consolidated to use a single, enhanced rate-limiting service
import fp from 'fastify-plugin';
import { rateLimitConfig, authRateLimitConfig, globalRateLimitConfig, ddosConfig, config } from '../config/config';
import { EnhancedRateLimitingService } from '../services/enhanced-rate-limiting.service';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';

const rateLimitPlugin: FastifyPluginAsync = async (fastify: any) => {
  // Skip rate limiting entirely in test environment
  if (process.env.NODE_ENV === 'test') {
    fastify.log.info('Rate limiting disabled for test environment');
    return;
  }

  // Initialize the single, enhanced rate limiting service for the entire application
  const enhancedRateLimit = new EnhancedRateLimitingService({
    global: {
      windowMs: globalRateLimitConfig.timeWindow,
      max: globalRateLimitConfig.max,
      headers: true,
      message: 'Global rate limit exceeded'
    },
    perUser: {
      windowMs: rateLimitConfig.timeWindow,
      max: rateLimitConfig.max,
      burst: Math.floor(rateLimitConfig.max * 0.2),
      premium: {
        max: Math.floor(rateLimitConfig.max * 1.5),
        burst: Math.floor(rateLimitConfig.max * 0.3)
      }
    },
    perIP: {
      windowMs: rateLimitConfig.timeWindow,
      max: rateLimitConfig.max,
      headers: true
    },
    geoLimits: config.NODE_ENV === 'production' ? {
      'CN': { windowMs: 15 * 60 * 1000, max: 50, reason: 'Geographic restriction' },
      'RU': { windowMs: 15 * 60 * 1000, max: 50, reason: 'Geographic restriction' }
    } : undefined,
    allowlist: ['127.0.0.1', '::1'],
    exemptUserRoles: ['admin', 'system'],
    exemptRoutes: ['/api/health', '/api/metrics', '/docs'],
    enableBehavioralAnalysis: true,
    suspiciousThreshold: 100,
    enablePenalties: true,
    penaltyMultiplier: 2,
    maxPenaltyTime: 24 * 60 * 60 * 1000,
    customRules: [
      {
        id: 'auth-strict',
        name: 'Strict Auth Limits',
        condition: (req) => req.url.startsWith('/api/auth/'),
        limit: {
          windowMs: authRateLimitConfig.timeWindow,
          max: authRateLimitConfig.max,
          headers: true,
          message: 'Too many authentication attempts'
        },
        action: 'block',
        priority: 100,
        enabled: true
      },
      {
        id: 'ddos-protection',
        name: 'DDoS Protection',
        condition: (req) => true, // Apply to all requests
        limit: {
          windowMs: ddosConfig.timeWindow,
          max: ddosConfig.maxRequests,
          headers: false,
          message: 'Request rate too high - possible DDoS attack'
        },
        action: 'block',
        priority: 1000,
        enabled: true
      }
    ]
  }, fastify.redis);

  // Register the single rate limiting middleware globally
  fastify.addHook('preHandler', enhancedRateLimit.createMiddleware());

  // Decorate the fastify instance with the service for potential manual use (e.g., in admin panels)
  fastify.decorate('enhancedRateLimit', enhancedRateLimit);

  // Add admin route to get rate limit stats
  fastify.get('/api/admin/ratelimit-stats', {
    preHandler: [fastify.authenticateAdmin],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const stats = await enhancedRateLimit.getStats();
      return reply.send(stats);
    }
  });

  // Graceful shutdown
  fastify.addHook('onClose', async () => {
    enhancedRateLimit.shutdown();
  });

  fastify.log.info(`✅ Enhanced rate limit plugin registered globally (Storage: ${enhancedRateLimit.storageType})`);
};

export default fp(rateLimitPlugin, { name: 'rateLimit' });
