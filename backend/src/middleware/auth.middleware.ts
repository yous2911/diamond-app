/**
 * Secure Authentication Middleware
 * Handles JWT token validation from HTTP-only cookies
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import '@fastify/cookie';
import { AuthService } from '../services/auth.service';
import { createSecureAuthRateLimiter } from '../services/secure-rate-limiter.service';

// User type is declared in types/fastify-extended.ts

/**
 * Authentication middleware that validates JWT tokens from cookies
 */
export async function authenticateMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Get token from HTTP-only cookie
    const token = request.cookies['access-token'];

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
    const decoded = await (request.server as any).jwt.verify(token);
    
    if (decoded.type !== 'access') {
      return reply.status(401).send({
        success: false,
        error: {
          message: 'Type de token invalide',
          code: 'INVALID_TOKEN_TYPE',
        },
      });
    }

    // The role is now included in the JWT payload, so we can read it directly.
    request.user = {
      studentId: decoded.studentId,
      email: decoded.email,
      type: decoded.type,
      role: decoded.role || 'student', // Default to 'student' if role is missing
    };

    return; // Continue with request

  } catch (error) {
    // Check if we can refresh the token
    const refreshToken = request.cookies['refresh-token'];
    
    if (refreshToken) {
      try {
        const newAccessToken = await (request.server as any).refreshJwt.verify(refreshToken);
        
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
          const newDecoded = await (request.server as any).jwt.verify(newAccessToken);
          request.user = {
            studentId: newDecoded.studentId,
            email: newDecoded.email,
            type: newDecoded.type,
          };

          return; // Continue with request
        }
      } catch (refreshError) {
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

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const token = request.cookies.auth_token;

    if (token) {
      const decoded = await (request.server as any).jwt.verify(token);
      
      if (decoded.type === 'access') {
        request.user = {
          studentId: decoded.studentId,
          email: decoded.email,
          type: decoded.type,
        };
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    request.user = undefined;
  }
  
  return; // Continue with request
}

/**
 * Admin authentication middleware
 */
export async function authenticateAdminMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
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
  if ((user as any).role !== 'admin') {
    return reply.status(403).send({
      success: false,
      error: {
        message: 'Accès administrateur requis',
        code: 'ADMIN_REQUIRED',
      },
    });
  }
}

/**
 * Rate limiting middleware sécurisé pour les endpoints d'authentification
 */
export const authRateLimitMiddleware = createSecureAuthRateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDuration: 60 * 60 * 1000, // 1 heure de blocage après dépassement
});