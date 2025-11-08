"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/plugins/auth.ts - Enhanced with secure cookie handling and JWT refresh
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const config_1 = require("../config/config");
const authPlugin = async (fastify) => {
    // Register cookie support with secure configuration
    await fastify.register(cookie_1.default, {
        secret: config_1.cookieConfig.secret,
        parseOptions: {
            httpOnly: config_1.cookieConfig.httpOnly,
            secure: config_1.cookieConfig.secure,
            sameSite: config_1.cookieConfig.sameSite,
            maxAge: config_1.cookieConfig.maxAge,
            path: '/',
            domain: config_1.config.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
        }
    });
    // Register JWT with refresh token support
    await fastify.register(jwt_1.default, {
        secret: config_1.jwtConfig.secret,
        sign: {
            algorithm: config_1.jwtConfig.algorithm,
            issuer: config_1.jwtConfig.issuer,
            audience: config_1.jwtConfig.audience,
            expiresIn: config_1.jwtConfig.expiresIn
        },
        verify: {
            algorithms: [config_1.jwtConfig.algorithm],
            issuer: config_1.jwtConfig.issuer,
            audience: config_1.jwtConfig.audience
        },
        cookie: {
            cookieName: 'access-token',
            signed: true
        }
    });
    // Register separate JWT instance for refresh tokens
    await fastify.register(jwt_1.default, {
        secret: config_1.jwtConfig.refreshSecret,
        namespace: 'refreshJwt',
        sign: {
            algorithm: config_1.jwtConfig.algorithm,
            issuer: config_1.jwtConfig.issuer,
            audience: config_1.jwtConfig.audience,
            expiresIn: config_1.jwtConfig.refreshExpiresIn
        },
        verify: {
            algorithms: [config_1.jwtConfig.algorithm],
            issuer: config_1.jwtConfig.issuer,
            audience: config_1.jwtConfig.audience
        },
        cookie: {
            cookieName: 'refresh-token',
            signed: true
        }
    });
    // Register authentication middleware decorators
    fastify.decorate('authenticate', auth_middleware_1.authenticateMiddleware);
    fastify.decorate('optionalAuth', auth_middleware_1.optionalAuthMiddleware);
    fastify.decorate('authenticateAdmin', auth_middleware_1.authenticateAdminMiddleware);
    fastify.decorate('authRateLimit', auth_middleware_1.authRateLimitMiddleware);
    // Add secure cookie helpers
    fastify.decorate('setAuthCookies', (reply, accessToken, refreshToken) => {
        // Set access token cookie (shorter expiry)
        reply.setCookie('access-token', accessToken, {
            httpOnly: true,
            secure: config_1.cookieConfig.secure,
            sameSite: config_1.cookieConfig.sameSite,
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/',
            signed: true
        });
        // Set refresh token cookie (longer expiry)
        reply.setCookie('refresh-token', refreshToken, {
            httpOnly: true,
            secure: config_1.cookieConfig.secure,
            sameSite: config_1.cookieConfig.sameSite,
            maxAge: config_1.cookieConfig.maxAge, // 7 days
            path: '/api/auth/refresh',
            signed: true
        });
    });
    fastify.decorate('clearAuthCookies', (reply) => {
        reply.clearCookie('access-token', { path: '/' });
        reply.clearCookie('refresh-token', { path: '/api/auth/refresh' });
    });
    // Token refresh endpoint is handled in routes/auth.ts to avoid duplication
    // The preHandler hook for auto-refreshing tokens has been removed.
    // Client-side should handle 401 responses and call the /refresh endpoint explicitly.
    fastify.log.info('✅ Enhanced auth plugin registered with secure cookies and refresh tokens');
};
exports.default = (0, fastify_plugin_1.default)(authPlugin, { name: 'auth' });
