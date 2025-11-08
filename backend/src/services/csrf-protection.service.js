"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSRFProtectionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
class CSRFProtectionService {
    constructor(options = {}) {
        this.activeTokens = new Map();
        this.options = {
            secretLength: 32,
            tokenLength: 32,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            cookieName: '_csrf',
            headerName: 'x-csrf-token',
            saltLength: 8,
            ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
            skipRoutes: ['/api/health', '/api/metrics', '/api/upload/health'],
            cookieOptions: {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            },
            ...options
        };
        // Start cleanup interval
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredTokens();
        }, 60 * 60 * 1000); // Every hour
    }
    /**
     * Generate a new CSRF token
     */
    generateToken(userId, sessionId) {
        const secret = crypto_1.default.randomBytes(this.options.secretLength).toString('hex');
        const salt = crypto_1.default.randomBytes(this.options.saltLength).toString('hex');
        const token = this.createTokenFromSecret(secret, salt);
        const csrfToken = {
            token: `${salt}.${token}`,
            secret,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + this.options.maxAge),
            userId,
            sessionId
        };
        // Store token for validation
        this.activeTokens.set(csrfToken.token, csrfToken);
        logger_1.logger.debug('CSRF token generated', {
            tokenId: csrfToken.token.substring(0, 8) + '...',
            userId,
            sessionId,
            expiresAt: csrfToken.expiresAt
        });
        return csrfToken;
    }
    /**
     * Validate CSRF token
     */
    validateToken(token, userId, sessionId) {
        try {
            if (!token) {
                logger_1.logger.warn('CSRF validation failed: No token provided');
                return false;
            }
            const storedToken = this.activeTokens.get(token);
            if (!storedToken) {
                logger_1.logger.warn('CSRF validation failed: Token not found', {
                    tokenId: token.substring(0, 8) + '...'
                });
                return false;
            }
            // Check expiration
            if (new Date() > storedToken.expiresAt) {
                logger_1.logger.warn('CSRF validation failed: Token expired', {
                    tokenId: token.substring(0, 8) + '...',
                    expiresAt: storedToken.expiresAt
                });
                this.activeTokens.delete(token);
                return false;
            }
            // Validate token format and integrity
            const [salt, tokenPart] = token.split('.');
            if (!salt || !tokenPart) {
                logger_1.logger.warn('CSRF validation failed: Invalid token format');
                return false;
            }
            const expectedToken = this.createTokenFromSecret(storedToken.secret, salt);
            if (!crypto_1.default.timingSafeEqual(Buffer.from(tokenPart), Buffer.from(expectedToken))) {
                logger_1.logger.warn('CSRF validation failed: Token integrity check failed');
                return false;
            }
            // Validate user context if provided
            if (userId && storedToken.userId && storedToken.userId !== userId) {
                logger_1.logger.warn('CSRF validation failed: User ID mismatch', {
                    tokenUserId: storedToken.userId,
                    requestUserId: userId
                });
                return false;
            }
            // Validate session context if provided
            if (sessionId && storedToken.sessionId && storedToken.sessionId !== sessionId) {
                logger_1.logger.warn('CSRF validation failed: Session ID mismatch', {
                    tokenSessionId: storedToken.sessionId,
                    requestSessionId: sessionId
                });
                return false;
            }
            logger_1.logger.debug('CSRF token validated successfully', {
                tokenId: token.substring(0, 8) + '...',
                userId,
                sessionId
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('CSRF validation error:', error);
            return false;
        }
    }
    /**
     * Create CSRF protection middleware
     */
    createMiddleware() {
        return async (request, reply) => {
            try {
                // Skip CSRF protection for certain methods
                if (this.options.ignoreMethods.includes(request.method)) {
                    return;
                }
                // Skip CSRF protection for certain routes
                const route = request.routeOptions?.url || request.url;
                if (this.options.skipRoutes.some(skipRoute => route.includes(skipRoute))) {
                    return;
                }
                // Get user and session context
                const userId = request.user?.id;
                const sessionId = request.session?.id || request.headers['x-session-id'];
                // For state-changing requests, validate CSRF token
                if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
                    const token = this.extractTokenFromRequest(request);
                    if (!token) {
                        logger_1.logger.warn('CSRF protection triggered: No token in request', {
                            method: request.method,
                            url: route,
                            userAgent: request.headers['user-agent'],
                            ip: request.ip,
                            userId
                        });
                        return reply.status(403).send({
                            error: 'CSRF token missing',
                            message: 'CSRF protection requires a valid token for this request'
                        });
                    }
                    if (!this.validateToken(token, userId, sessionId)) {
                        logger_1.logger.warn('CSRF protection triggered: Invalid token', {
                            method: request.method,
                            url: route,
                            userAgent: request.headers['user-agent'],
                            ip: request.ip,
                            userId,
                            tokenId: token.substring(0, 8) + '...'
                        });
                        return reply.status(403).send({
                            error: 'CSRF token invalid',
                            message: 'CSRF protection rejected this request due to invalid token'
                        });
                    }
                    // Optional: Remove token after successful validation for one-time use
                    // this.activeTokens.delete(token);
                }
            }
            catch (error) {
                logger_1.logger.error('CSRF middleware error:', error);
                return reply.status(500).send({
                    error: 'CSRF protection error',
                    message: 'Internal error in CSRF protection system'
                });
            }
            return; // Explicit return for all code paths
        };
    }
    /**
     * Endpoint to get CSRF token
     */
    async getTokenEndpoint(request, reply) {
        try {
            const userId = request.user?.id;
            const sessionId = request.session?.id || request.headers['x-session-id'];
            const csrfToken = this.generateToken(userId, sessionId);
            // Set token in cookie using proper setCookie method
            reply.setCookie(this.options.cookieName, csrfToken.token, {
                httpOnly: this.options.cookieOptions.httpOnly,
                secure: this.options.cookieOptions.secure,
                sameSite: this.options.cookieOptions.sameSite,
                maxAge: this.options.cookieOptions.maxAge
            });
            return reply.send({
                success: true,
                token: csrfToken.token,
                expiresAt: csrfToken.expiresAt.toISOString()
            });
        }
        catch (error) {
            logger_1.logger.error('Error generating CSRF token:', error);
            return reply.status(500).send({
                success: false,
                error: 'Failed to generate CSRF token'
            });
        }
    }
    /**
     * Refresh CSRF token
     */
    async refreshToken(oldToken, userId, sessionId) {
        try {
            // Validate old token first
            if (!this.validateToken(oldToken, userId, sessionId)) {
                return null;
            }
            // Remove old token
            this.activeTokens.delete(oldToken);
            // Generate new token
            return this.generateToken(userId, sessionId);
        }
        catch (error) {
            logger_1.logger.error('Error refreshing CSRF token:', error);
            return null;
        }
    }
    /**
     * Revoke token (logout, session invalidation)
     */
    revokeToken(token) {
        const deleted = this.activeTokens.delete(token);
        if (deleted) {
            logger_1.logger.debug('CSRF token revoked', {
                tokenId: token.substring(0, 8) + '...'
            });
        }
        return deleted;
    }
    /**
     * Revoke all tokens for a user
     */
    revokeUserTokens(userId) {
        let revokedCount = 0;
        for (const [token, tokenData] of this.activeTokens.entries()) {
            if (tokenData.userId === userId) {
                this.activeTokens.delete(token);
                revokedCount++;
            }
        }
        if (revokedCount > 0) {
            logger_1.logger.info('CSRF tokens revoked for user', {
                userId,
                revokedCount
            });
        }
        return revokedCount;
    }
    /**
     * Extract token from request headers, body, or cookies
     */
    extractTokenFromRequest(request) {
        // Check header
        const headerToken = request.headers[this.options.headerName];
        if (headerToken) {
            return headerToken;
        }
        // Check body
        const body = request.body;
        if (body && body._csrf) {
            return body._csrf;
        }
        // Check cookies
        const cookieHeader = request.headers.cookie;
        if (cookieHeader) {
            const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
                const [name, value] = cookie.trim().split('=');
                if (name && value) {
                    acc[name] = value;
                }
                return acc;
            }, {});
            if (cookies[this.options.cookieName]) {
                return cookies[this.options.cookieName];
            }
        }
        // Check query parameters (less secure, but sometimes needed)
        const query = request.query;
        if (query && query._csrf) {
            return query._csrf;
        }
        return null;
    }
    /**
     * Create token from secret and salt
     */
    createTokenFromSecret(secret, salt) {
        const hmac = crypto_1.default.createHmac('sha256', secret);
        hmac.update(salt);
        return hmac.digest('hex');
    }
    /**
     * Cleanup expired tokens
     */
    cleanupExpiredTokens() {
        const now = new Date();
        let cleanedCount = 0;
        for (const [token, tokenData] of this.activeTokens.entries()) {
            if (now > tokenData.expiresAt) {
                this.activeTokens.delete(token);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            logger_1.logger.debug('CSRF tokens cleaned up', {
                cleanedCount,
                activeCount: this.activeTokens.size
            });
        }
    }
    /**
     * Get token statistics
     */
    getStats() {
        const now = new Date();
        let expiredCount = 0;
        for (const tokenData of this.activeTokens.values()) {
            if (now > tokenData.expiresAt) {
                expiredCount++;
            }
        }
        return {
            activeTokens: this.activeTokens.size - expiredCount,
            expiredTokens: expiredCount,
            totalGenerated: this.activeTokens.size
        };
    }
    /**
     * Cleanup on shutdown
     */
    shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.activeTokens.clear();
        logger_1.logger.info('CSRF protection service shutdown');
    }
}
exports.CSRFProtectionService = CSRFProtectionService;
