"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/plugins/rate-limit.ts - Consolidated to use a single, enhanced rate-limiting service
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const config_1 = require("../config/config");
const enhanced_rate_limiting_service_1 = require("../services/enhanced-rate-limiting.service");
const rateLimitPlugin = async (fastify) => {
    // Skip rate limiting entirely in test environment
    if (process.env.NODE_ENV === 'test') {
        fastify.log.info('Rate limiting disabled for test environment');
        return;
    }
    // Initialize the single, enhanced rate limiting service for the entire application
    const enhancedRateLimit = new enhanced_rate_limiting_service_1.EnhancedRateLimitingService({
        global: {
            windowMs: config_1.globalRateLimitConfig.timeWindow,
            max: config_1.globalRateLimitConfig.max,
            headers: true,
            message: 'Global rate limit exceeded'
        },
        perUser: {
            windowMs: config_1.rateLimitConfig.timeWindow,
            max: config_1.rateLimitConfig.max,
            burst: Math.floor(config_1.rateLimitConfig.max * 0.2),
            premium: {
                max: Math.floor(config_1.rateLimitConfig.max * 1.5),
                burst: Math.floor(config_1.rateLimitConfig.max * 0.3)
            }
        },
        perIP: {
            windowMs: config_1.rateLimitConfig.timeWindow,
            max: config_1.rateLimitConfig.max,
            headers: true
        },
        geoLimits: config_1.config.NODE_ENV === 'production' ? {
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
                    windowMs: config_1.authRateLimitConfig.timeWindow,
                    max: config_1.authRateLimitConfig.max,
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
                    windowMs: config_1.ddosConfig.timeWindow,
                    max: config_1.ddosConfig.maxRequests,
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
        handler: async (request, reply) => {
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
exports.default = (0, fastify_plugin_1.default)(rateLimitPlugin, { name: 'rateLimit' });
