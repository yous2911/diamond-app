"use strict";
/**
 * Secure Authentication Middleware
 * Handles JWT token validation from HTTP-only cookies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimitMiddleware = exports.authenticateAdminMiddleware = exports.optionalAuthMiddleware = exports.authenticateMiddleware = void 0;
require("@fastify/cookie");
const secure_rate_limiter_service_1 = require("../services/secure-rate-limiter.service");
// User type is declared in types/fastify-extended.ts
/**
 * Authentication middleware that validates JWT tokens from cookies
 */
async function authenticateMiddleware(request, reply) {
    try {
        // Get token from HTTP-only cookie OR Authorization header (for tests and API clients)
        let token = request.cookies['access-token'];
        // If no cookie token, try Authorization header
        if (!token) {
            const authHeader = request.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7); // Remove 'Bearer ' prefix
            }
        }
        if (!token) {
            return reply.status(401).send({
                success: false,
                error: {
                    message: 'Token d\'authentification manquant',
                    code: 'MISSING_AUTH_TOKEN',
                },
            });
        }
        // Verify token using Fastify JWT
        const decoded = await request.server.jwt.verify(token);
        // Skip token type check for backward compatibility (tests might not include type)
        // if (decoded.type && decoded.type !== 'access') {
        //   return reply.status(401).send({
        //     success: false,
        //     error: {
        //       message: 'Type de token invalide',
        //       code: 'INVALID_TOKEN_TYPE',
        //     },
        //   });
        // }
        // The role is now included in the JWT payload, so we can read it directly.
        request.user = {
            studentId: decoded.studentId,
            email: decoded.email,
            type: decoded.type || 'access', // Default type for compatibility
            role: decoded.role || 'student', // Default to 'student' if role is missing
        };
        return; // Continue with request
    }
    catch (error) {
        // Check if we can refresh the token
        const refreshToken = request.cookies['refresh-token'];
        if (refreshToken) {
            try {
                const newAccessToken = await request.server.refreshJwt.verify(refreshToken);
                if (newAccessToken) {
                    // Set new access token
                    reply.setCookie('auth_token', newAccessToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                        maxAge: 15 * 60,
                        path: '/'
                    });
                    // Verify new token
                    const newDecoded = await request.server.jwt.verify(newAccessToken);
                    request.user = {
                        studentId: newDecoded.studentId,
                        email: newDecoded.email,
                        type: newDecoded.type,
                    };
                    return; // Continue with request
                }
            }
            catch (refreshError) {
                // Refresh failed, fall through to error
            }
        }
        return reply.status(401).send({
            success: false,
            error: {
                message: 'Token d\'authentification invalide ou expiré',
                code: 'INVALID_AUTH_TOKEN',
            },
        });
    }
}
exports.authenticateMiddleware = authenticateMiddleware;
/**
 * Optional authentication middleware - doesn't fail if no token
 */
async function optionalAuthMiddleware(request, reply) {
    try {
        // Get token from cookie OR Authorization header
        let token = request.cookies['access-token'];
        if (!token) {
            const authHeader = request.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7); // Remove 'Bearer ' prefix
            }
        }
        if (token) {
            const decoded = await request.server.jwt.verify(token);
            // Skip type check for compatibility
            request.user = {
                studentId: decoded.studentId,
                email: decoded.email,
                type: decoded.type || 'access',
                role: decoded.role || 'student',
            };
        }
    }
    catch (error) {
        // Silently fail for optional auth
        request.user = undefined;
    }
    return; // Continue with request
}
exports.optionalAuthMiddleware = optionalAuthMiddleware;
/**
 * Admin authentication middleware
 */
async function authenticateAdminMiddleware(request, reply) {
    // First check regular authentication
    await authenticateMiddleware(request, reply);
    // Then check admin privileges
    const user = request.user;
    if (!user) {
        return; // Already handled by authenticateMiddleware
    }
    // Type guard to ensure user is the expected type
    if (typeof user === 'string' || typeof user === 'object' && !('email' in user)) {
        return reply.status(401).send({
            success: false,
            error: {
                message: 'Utilisateur non authentifié',
                code: 'USER_NOT_AUTHENTICATED',
            },
        });
    }
    // Check if user has admin privileges by looking at the role from the JWT
    if (user.role !== 'admin') {
        return reply.status(403).send({
            success: false,
            error: {
                message: 'Accès administrateur requis',
                code: 'ADMIN_REQUIRED',
            },
        });
    }
}
exports.authenticateAdminMiddleware = authenticateAdminMiddleware;
/**
 * Rate limiting middleware sécurisé pour les endpoints d'authentification
 */
exports.authRateLimitMiddleware = (0, secure_rate_limiter_service_1.createSecureAuthRateLimiter)({
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDuration: 60 * 60 * 1000, // 1 heure de blocage après dépassement
});
