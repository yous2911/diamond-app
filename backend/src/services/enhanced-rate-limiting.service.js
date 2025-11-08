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
exports.EnhancedRateLimitingService = void 0;
const geoip = __importStar(require("geoip-lite"));
const ip_range_check_1 = __importDefault(require("ip-range-check"));
const logger_1 = require("../utils/logger");
class EnhancedRateLimitingService {
    constructor(options, redis) {
        this.redis = redis;
        // In-memory stores (fallback)
        this.store = new Map();
        this.penalties = new Map(); // IP -> penalty end time
        this.suspiciousIPs = new Map(); // IP -> suspicious score
        this.options = {
            global: {
                windowMs: 15 * 60 * 1000,
                max: 1000
            },
            perUser: {
                windowMs: 15 * 60 * 1000,
                max: 100,
                burst: 20
            },
            perIP: {
                windowMs: 15 * 60 * 1000,
                max: 100
            },
            allowlist: [],
            blocklist: [],
            exemptUserRoles: ['admin', 'system'],
            exemptRoutes: ['/api/health', '/api/metrics'],
            enableBehavioralAnalysis: true,
            suspiciousThreshold: 50,
            enablePenalties: true,
            penaltyMultiplier: 2,
            maxPenaltyTime: 24 * 60 * 60 * 1000,
            headers: true,
            retryAfterHeader: true,
            redisPrefix: 'rl',
            ...options
        };
        this.storageType = this.redis ? 'redis' : 'in-memory';
        // Setup Redis prefixes
        const prefix = this.options.redisPrefix;
        this.storePrefix = `${prefix}:store`;
        this.penaltiesPrefix = `${prefix}:penalties`;
        this.suspiciousIPsPrefix = `${prefix}:suspicious`;
        // Only run cleanup for in-memory store
        if (this.storageType === 'in-memory') {
            this.cleanupInterval = setInterval(() => {
                this.cleanup();
            }, 60 * 1000);
        }
    }
    /**
     * Create enhanced rate limiting middleware
     */
    createMiddleware() {
        return async (request, reply) => {
            try {
                const ip = this.getClientIP(request);
                const userId = request.user?.id;
                const userRole = request.user?.role;
                const route = request.routeOptions?.url || request.url;
                // Check if should skip rate limiting
                if (this.shouldSkip(request, ip, userRole, route)) {
                    return;
                }
                // Check penalties first
                if (await this.isUnderPenalty(ip)) {
                    const penaltyEnd = await this.getPenaltyEndTime(ip);
                    const retryAfter = penaltyEnd ? Math.ceil((penaltyEnd - Date.now()) / 1000) : 0;
                    logger_1.logger.warn('Request blocked due to penalty', {
                        ip,
                        userId,
                        route,
                        penaltyEnd: penaltyEnd ? new Date(penaltyEnd) : null,
                        retryAfter
                    });
                    return this.sendRateLimitResponse(reply, {
                        windowMs: retryAfter * 1000,
                        max: 0,
                        message: 'IP temporarily blocked due to suspicious activity'
                    }, 0, retryAfter);
                }
                // Apply multiple rate limiting layers
                const limits = await Promise.all([
                    this.checkGlobalLimit(request),
                    this.checkIPLimit(request, ip),
                    this.checkUserLimit(request, userId),
                    this.checkGeoLimit(request, ip),
                    this.checkCustomRules(request)
                ]);
                // Find the most restrictive limit that was exceeded
                const violatedLimit = limits.find(limit => limit.violated);
                if (violatedLimit) {
                    await this.handleRateLimitViolation(request, ip, userId, violatedLimit);
                    return this.sendRateLimitResponse(reply, violatedLimit.config, violatedLimit.remaining, violatedLimit.retryAfter);
                }
                // Update behavioral analysis
                if (this.options.enableBehavioralAnalysis) {
                    await this.updateBehavioralAnalysis(request, ip, userId);
                }
                // Add rate limit headers to successful requests
                if (this.options.headers) {
                    const ipLimit = limits.find(l => l.type === 'ip');
                    if (ipLimit) {
                        reply.header('X-RateLimit-Limit', ipLimit.config.max);
                        reply.header('X-RateLimit-Remaining', ipLimit.remaining);
                        reply.header('X-RateLimit-Reset', Math.ceil(ipLimit.resetTime / 1000));
                    }
                }
            }
            catch (error) {
                logger_1.logger.error('Rate limiting error:', error);
                // Don't block requests on rate limiting errors
            }
            return; // Explicit return for all code paths
        };
    }
    /**
     * Check global rate limit
     */
    async checkGlobalLimit(request) {
        const key = 'global';
        const config = this.options.global;
        const entry = await this.getOrCreateEntry(key, config.windowMs);
        return this.evaluateLimit(key, entry, config, 'global');
    }
    /**
     * Check IP-based rate limit
     */
    async checkIPLimit(request, ip) {
        const key = `ip:${ip}`;
        const config = this.options.perIP;
        const entry = await this.getOrCreateEntry(key, config.windowMs);
        // Apply penalty multiplier if IP has penalties
        const penaltyMultiplier = await this.getPenaltyMultiplier(ip);
        const adjustedConfig = {
            ...config,
            max: Math.floor(config.max / penaltyMultiplier)
        };
        return this.evaluateLimit(key, entry, adjustedConfig, 'ip');
    }
    /**
     * Check user-based rate limit
     */
    async checkUserLimit(request, userId) {
        if (!userId) {
            return { violated: false, type: 'user', remaining: 999, resetTime: Date.now(), retryAfter: 0, config: this.options.perUser };
        }
        const userRole = request.user?.role;
        const isPremium = userRole === 'premium' || userRole === 'admin';
        const key = `user:${userId}`;
        const config = this.options.perUser;
        const maxRequests = isPremium && config.premium ? config.premium.max : config.max;
        const adjustedConfig = {
            ...config,
            max: maxRequests
        };
        const entry = await this.getOrCreateEntry(key, config.windowMs);
        return this.evaluateLimit(key, entry, adjustedConfig, 'user');
    }
    /**
     * Check geographic rate limit
     */
    async checkGeoLimit(request, ip) {
        if (!this.options.geoLimits) {
            return { violated: false, type: 'geo', remaining: 999, resetTime: Date.now(), retryAfter: 0, config: { windowMs: 0, max: 999 } };
        }
        const geo = geoip.lookup(ip);
        const countryCode = geo?.country;
        if (!countryCode || !this.options.geoLimits[countryCode]) {
            return { violated: false, type: 'geo', remaining: 999, resetTime: Date.now(), retryAfter: 0, config: { windowMs: 0, max: 999 } };
        }
        const geoConfig = this.options.geoLimits[countryCode];
        const key = `geo:${countryCode}:${ip}`;
        const entry = await this.getOrCreateEntry(key, geoConfig.windowMs);
        return this.evaluateLimit(key, entry, geoConfig, 'geo');
    }
    /**
     * Check custom rules
     */
    async checkCustomRules(request) {
        if (!this.options.customRules) {
            return { violated: false, type: 'custom', remaining: 999, resetTime: Date.now(), retryAfter: 0, config: { windowMs: 0, max: 999 } };
        }
        // Sort rules by priority
        const sortedRules = this.options.customRules
            .filter(rule => rule.enabled)
            .sort((a, b) => b.priority - a.priority);
        for (const rule of sortedRules) {
            if (rule.condition(request)) {
                const key = `rule:${rule.id}:${this.getClientIP(request)}`;
                const entry = await this.getOrCreateEntry(key, rule.limit.windowMs);
                const result = await this.evaluateLimit(key, entry, rule.limit, 'custom');
                if (result.violated) {
                    return {
                        ...result,
                        rule: rule
                    };
                }
            }
        }
        return { violated: false, type: 'custom', remaining: 999, resetTime: Date.now(), retryAfter: 0, config: { windowMs: 0, max: 999 } };
    }
    /**
     * Evaluate if a limit is violated
     */
    async evaluateLimit(key, entry, config, type) {
        const now = Date.now();
        const windowMs = 'windowMs' in config ? config.windowMs : 15 * 60 * 1000;
        const max = 'max' in config ? config.max : 100;
        // Check if window has expired
        if (now > entry.resetTime) {
            entry.count = 0;
            entry.resetTime = now + windowMs;
            entry.firstRequest = now;
        }
        // Increment counter
        entry.count++;
        entry.lastRequest = now;
        const remaining = Math.max(0, max - entry.count);
        const violated = entry.count > max;
        const retryAfter = violated ? Math.ceil((entry.resetTime - now) / 1000) : 0;
        // Update store
        if (this.storageType === 'redis') {
            const redisKey = `${this.storePrefix}:${key}`;
            await this.redis.hset(redisKey, 'count', entry.count, 'lastRequest', entry.lastRequest);
        }
        else {
            this.store.set(key, entry);
        }
        return {
            violated,
            type,
            remaining,
            resetTime: entry.resetTime,
            retryAfter,
            config,
            key
        };
    }
    /**
     * Get or create rate limit entry
     */
    async getOrCreateEntry(key, windowMs) {
        const now = Date.now();
        if (this.storageType === 'redis') {
            const redisKey = `${this.storePrefix}:${key}`;
            const entryData = await this.redis.hgetall(redisKey);
            if (entryData && Object.keys(entryData).length > 0 && now <= parseInt(entryData.resetTime, 10)) {
                return {
                    count: parseInt(entryData.count, 10),
                    resetTime: parseInt(entryData.resetTime, 10),
                    firstRequest: parseInt(entryData.firstRequest, 10),
                    lastRequest: parseInt(entryData.lastRequest, 10),
                    blocked: entryData.blocked === 'true',
                    warnings: parseInt(entryData.warnings, 10)
                };
            }
            const newEntry = {
                count: 0,
                resetTime: now + windowMs,
                firstRequest: now,
                lastRequest: now,
                blocked: false,
                warnings: 0
            };
            await this.redis.hmset(redisKey, newEntry);
            await this.redis.expire(redisKey, Math.ceil(windowMs / 1000));
            return newEntry;
        }
        else {
            const existing = this.store.get(key);
            if (existing && now <= existing.resetTime) {
                return existing;
            }
        }
        const newEntry = {
            count: 0,
            resetTime: now + windowMs,
            firstRequest: now,
            lastRequest: now,
            blocked: false,
            warnings: 0
        };
        this.store.set(key, newEntry);
        return newEntry;
    }
    /**
     * Handle rate limit violation
     */
    async handleRateLimitViolation(request, ip, userId, limit) {
        const route = request.routeOptions?.url || request.url;
        logger_1.logger.warn('Rate limit exceeded', {
            type: limit.type,
            ip,
            userId,
            route,
            limit: limit.config.max,
            current: limit.remaining,
            userAgent: request.headers['user-agent']
        });
        // Update suspicious behavior score
        if (this.options.enableBehavioralAnalysis) {
            const scoreIncrement = this.getRateLimitViolationScore(limit.type);
            let newScore;
            if (this.storageType === 'redis') {
                const redisKey = `${this.suspiciousIPsPrefix}:${ip}`;
                newScore = await this.redis.incrby(redisKey, scoreIncrement);
                // Set expiry for suspicious score to decay naturally
                await this.redis.expire(redisKey, this.options.maxPenaltyTime / 1000);
            }
            else {
                const currentScore = this.suspiciousIPs.get(ip) || 0;
                newScore = currentScore + scoreIncrement;
                this.suspiciousIPs.set(ip, newScore);
            }
            // Apply penalty if score exceeds threshold
            if (newScore >= this.options.suspiciousThreshold && this.options.enablePenalties) {
                await this.applyPenalty(ip, newScore);
            }
        }
        // Handle custom rule actions
        if (limit.rule && limit.rule.action !== 'block') {
            await this.handleCustomAction(request, limit.rule);
        }
    }
    /**
     * Apply penalty to IP
     */
    async applyPenalty(ip, score) {
        const penaltyDurationMs = Math.min(score * this.options.penaltyMultiplier * 60 * 1000, this.options.maxPenaltyTime);
        const penaltyEnd = Date.now() + penaltyDurationMs;
        const penaltyDurationSec = Math.ceil(penaltyDurationMs / 1000);
        if (this.storageType === 'redis') {
            const redisKey = `${this.penaltiesPrefix}:${ip}`;
            await this.redis.setex(redisKey, penaltyDurationSec, penaltyEnd.toString());
        }
        else {
            this.penalties.set(ip, penaltyEnd);
        }
        logger_1.logger.warn('IP penalty applied', {
            ip,
            score,
            penaltyDuration: penaltyDurationSec,
            penaltyEnd: new Date(penaltyEnd)
        });
    }
    /**
     * Handle custom rule actions
     */
    async handleCustomAction(request, rule) {
        switch (rule.action) {
            case 'delay':
                // Add artificial delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                break;
            case 'captcha':
                // Would integrate with CAPTCHA service
                logger_1.logger.info('CAPTCHA challenge required', { ruleId: rule.id });
                break;
            case 'warn':
                // Just log warning
                logger_1.logger.warn('Rate limit warning triggered', { ruleId: rule.id });
                break;
        }
    }
    /**
     * Send rate limit response
     */
    sendRateLimitResponse(reply, config, remaining, retryAfter) {
        if (this.options.headers) {
            reply.header('X-RateLimit-Limit', config.max);
            reply.header('X-RateLimit-Remaining', remaining);
            reply.header('X-RateLimit-Reset', Math.ceil((Date.now() + config.windowMs) / 1000));
        }
        if (this.options.retryAfterHeader && retryAfter > 0) {
            reply.header('Retry-After', retryAfter);
        }
        return reply.status(429).send({
            error: 'Too Many Requests',
            message: config.message || this.options.message || 'Rate limit exceeded',
            retryAfter: retryAfter > 0 ? retryAfter : undefined
        });
    }
    /**
     * Check if request should skip rate limiting
     */
    shouldSkip(request, ip, userRole, route) {
        // Check allowlist
        if (this.options.allowlist?.some(allowed => (0, ip_range_check_1.default)(ip, allowed))) {
            return true;
        }
        // Check exempt user roles
        if (userRole && this.options.exemptUserRoles?.includes(userRole)) {
            return true;
        }
        // Check exempt routes
        if (route && this.options.exemptRoutes?.some(exemptRoute => route.includes(exemptRoute))) {
            return true;
        }
        return false;
    }
    /**
     * Get client IP address
     */
    getClientIP(request) {
        return request.headers['x-forwarded-for'] ||
            request.headers['x-real-ip'] ||
            request.ip ||
            'unknown';
    }
    /**
     * Check if IP is under penalty
     */
    async isUnderPenalty(ip) {
        const penaltyEnd = await this.getPenaltyEndTime(ip);
        if (!penaltyEnd)
            return false;
        if (Date.now() > penaltyEnd) {
            if (this.storageType === 'redis') {
                await this.redis.del(`${this.penaltiesPrefix}:${ip}`);
            }
            else {
                this.penalties.delete(ip);
            }
            return false;
        }
        return true;
    }
    async getPenaltyEndTime(ip) {
        if (this.storageType === 'redis') {
            const value = await this.redis.get(`${this.penaltiesPrefix}:${ip}`);
            return value ? parseInt(value, 10) : null;
        }
        return this.penalties.get(ip) || null;
    }
    /**
     * Get penalty multiplier for IP
     */
    async getPenaltyMultiplier(ip) {
        let suspiciousScore = 0;
        if (this.storageType === 'redis') {
            const scoreStr = await this.redis.get(`${this.suspiciousIPsPrefix}:${ip}`);
            suspiciousScore = scoreStr ? parseInt(scoreStr, 10) : 0;
        }
        else {
            suspiciousScore = this.suspiciousIPs.get(ip) || 0;
        }
        return Math.max(1, Math.floor(suspiciousScore / 20));
    }
    /**
     * Get violation score based on limit type
     */
    getRateLimitViolationScore(type) {
        switch (type) {
            case 'global': return 10;
            case 'ip': return 15;
            case 'user': return 5;
            case 'geo': return 20;
            case 'custom': return 25;
            default: return 10;
        }
    }
    /**
     * Update behavioral analysis
     */
    async updateBehavioralAnalysis(request, ip, userId) {
        const userAgent = request.headers['user-agent'];
        const route = request.routeOptions?.url || request.url;
        let scoreIncrement = 0;
        if (!userAgent || userAgent.length < 10) {
            scoreIncrement += 5;
        }
        if (route.includes('/auth/') || route.includes('/admin/')) {
            scoreIncrement += 3;
        }
        if (scoreIncrement > 0) {
            if (this.storageType === 'redis') {
                const redisKey = `${this.suspiciousIPsPrefix}:${ip}`;
                await this.redis.incrby(redisKey, scoreIncrement);
                await this.redis.expire(redisKey, this.options.maxPenaltyTime / 1000);
            }
            else {
                const score = this.suspiciousIPs.get(ip) || 0;
                this.suspiciousIPs.set(ip, score + scoreIncrement);
            }
        }
    }
    /**
     * Cleanup expired entries and penalties
     */
    cleanup() {
        // This method is only for the in-memory store. Redis handles its own expirations.
        if (this.storageType === 'redis')
            return;
        const now = Date.now();
        let cleanedEntries = 0;
        let cleanedPenalties = 0;
        let cleanedSuspicious = 0;
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.resetTime) {
                this.store.delete(key);
                cleanedEntries++;
            }
        }
        for (const [ip, penaltyEnd] of this.penalties.entries()) {
            if (now > penaltyEnd) {
                this.penalties.delete(ip);
                cleanedPenalties++;
            }
        }
        for (const [ip, score] of this.suspiciousIPs.entries()) {
            const newScore = Math.max(0, score - 1);
            if (newScore === 0) {
                this.suspiciousIPs.delete(ip);
                cleanedSuspicious++;
            }
            else {
                this.suspiciousIPs.set(ip, newScore);
            }
        }
        if (cleanedEntries > 0 || cleanedPenalties > 0 || cleanedSuspicious > 0) {
            logger_1.logger.debug('Rate limiting cleanup completed', {
                cleanedEntries,
                cleanedPenalties,
                cleanedSuspicious,
                activeEntries: this.store.size,
                activePenalties: this.penalties.size,
                suspiciousIPs: this.suspiciousIPs.size
            });
        }
    }
    /**
     * Get rate limiting statistics
     */
    async getStats() {
        if (this.storageType === 'redis') {
            const [totalEntries, penaltyKeys, suspiciousKeys] = await Promise.all([
                this.redis.keys(`${this.storePrefix}:*`).then(k => k.length),
                this.redis.keys(`${this.penaltiesPrefix}:*`),
                this.redis.keys(`${this.suspiciousIPsPrefix}:*`),
            ]);
            const suspiciousScores = suspiciousKeys.length > 0
                ? await this.redis.mget(...suspiciousKeys)
                : [];
            const topSuspiciousIPs = suspiciousKeys
                .map((key, i) => ({ ip: key.split(':').pop(), score: parseInt(suspiciousScores[i], 10) }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);
            return {
                storage: 'redis',
                totalEntries,
                activePenalties: penaltyKeys.length,
                suspiciousIPs: suspiciousKeys.length,
                topSuspiciousIPs
            };
        }
        else {
            // In-memory stats
            const now = Date.now();
            const activeEntries = Array.from(this.store.values()).filter(entry => now <= entry.resetTime);
            const activePenalties = Array.from(this.penalties.values()).filter(end => now < end);
            return {
                storage: 'in-memory',
                activeEntries: activeEntries.length,
                totalEntries: this.store.size,
                activePenalties: activePenalties.length,
                suspiciousIPs: this.suspiciousIPs.size,
                topSuspiciousIPs: Array.from(this.suspiciousIPs.entries())
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
            };
        }
    }
    /**
     * Manually block IP
     */
    async blockIP(ip, durationMs = 24 * 60 * 60 * 1000) {
        if (this.storageType === 'redis') {
            const redisKey = `${this.penaltiesPrefix}:${ip}`;
            const durationSec = Math.ceil(durationMs / 1000);
            await this.redis.setex(redisKey, durationSec, (Date.now() + durationMs).toString());
        }
        else {
            this.penalties.set(ip, Date.now() + durationMs);
        }
        logger_1.logger.info('IP manually blocked', { ip, duration: durationMs / 1000 });
    }
    /**
     * Manually unblock IP
     */
    async unblockIP(ip) {
        if (this.storageType === 'redis') {
            await this.redis.del(`${this.penaltiesPrefix}:${ip}`);
            await this.redis.del(`${this.suspiciousIPsPrefix}:${ip}`);
        }
        else {
            this.penalties.delete(ip);
            this.suspiciousIPs.delete(ip);
        }
        logger_1.logger.info('IP manually unblocked', { ip });
    }
    /**
     * Shutdown cleanup
     */
    shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        // For in-memory, clear maps
        if (this.storageType === 'in-memory') {
            this.store.clear();
            this.penalties.clear();
            this.suspiciousIPs.clear();
        }
        // Redis connection is managed by the plugin, so no need to close it here.
        logger_1.logger.info('Enhanced rate limiting service shutdown');
    }
}
exports.EnhancedRateLimitingService = EnhancedRateLimitingService;
