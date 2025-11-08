import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { authSchemas, loginSchema, registerSchema } from '../schemas/auth.schema';
import { AuthService } from '../services/auth.service';
import { addSendWelcomeEmailJob } from '../jobs/producers/email.producer';
import { serviceContainer } from '../services/service-factory';

// Types will be inferred from Zod schemas, removing manual interfaces
type LoginRequestBody = z.infer<typeof loginSchema>;
type RegisterRequestBody = z.infer<typeof registerSchema>;

interface PasswordResetBody {
  email: string;
}

interface PasswordResetConfirmBody {
  token: string;
  newPassword: string;
}

// Type definitions for better type safety
interface AuthenticatedRequest extends FastifyRequest {
  user: {
    studentId: number;
    email: string;
    role: string;
  };
}

export default async function authRoutes(fastify: FastifyInstance) {
  // Use direct instantiation - serviceContainer doesn't have authService registered
  const authService = new AuthService();
  const sevenDaysInSeconds = 7 * 24 * 60 * 60;

  // Secure login endpoint
  fastify.post('/login', {
    schema: {
      body: loginSchema,
    },
    preValidation: fastify.csrfProtection,
    handler: async (
      request: FastifyRequest<{ Body: LoginRequestBody }>,
      reply: FastifyReply
    ) => {
      const student = await authService.authenticateStudent(
        request.body,
        request.log
      );

      const accessTokenPayload = {
        studentId: student.id,
        email: student.email || `${student.prenom}.${student.nom}@student.local`,
        role: 'student',
      };
      const refreshTokenPayload = {
        ...accessTokenPayload,
        jti: uuidv4(),
      };

      const accessToken = await reply.jwtSign(accessTokenPayload, {
        expiresIn: '15m',
      });
      const refreshToken = await (fastify as unknown as { refreshJwt: { sign: (payload: any, options: any) => Promise<string> } }).refreshJwt.sign(
        refreshTokenPayload,
        { expiresIn: '7d' }
      );

      reply
        .setCookie('access-token', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 15 * 60, // 15 minutes in seconds
        })
        .setCookie('refresh-token', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/api/auth/refresh',
          maxAge: sevenDaysInSeconds,
        });

      const csrfToken = await reply.generateCsrf();
      return reply.send({
        success: true,
        data: {
          student: {
            id: student.id,
            email: student.email,
            role: student.role,
          },
          csrfToken,
          message: 'Connexion réussie',
        },
      });
    },
  });

  // Register new student
  fastify.post('/register', {
    schema: {
      body: registerSchema,
    },
    preValidation: fastify.csrfProtection,
    handler: async (
      request: FastifyRequest<{ Body: RegisterRequestBody }>,
      reply: FastifyReply
    ) => {
      const student = await authService.registerStudent(
        request.body,
        request.log
      );

      // Automatically log in the user after registration
      const accessTokenPayload = {
        studentId: student.id,
        email: student.email,
        role: student.role,
      };
      const refreshTokenPayload = {
        ...accessTokenPayload,
        jti: uuidv4(),
      };

      const accessToken = await reply.jwtSign(accessTokenPayload, {
        expiresIn: '15m',
      });
      const refreshToken = await (fastify as unknown as { refreshJwt: { sign: (payload: any, options: any) => Promise<string> } }).refreshJwt.sign(
        refreshTokenPayload,
        { expiresIn: '7d' }
      );

      reply
        .setCookie('access-token', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 15 * 60,
        })
        .setCookie('refresh-token', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/api/auth/refresh',
          maxAge: sevenDaysInSeconds,
        });

      // Offload welcome email to the background queue
      addSendWelcomeEmailJob({
        email: student.email,
        name: student.prenom,
      });

      const csrfToken = await reply.generateCsrf();
      return reply.status(201).send({
        success: true,
        data: {
          student: {
            id: student.id,
            email: student.email,
            role: student.role,
          },
          csrfToken,
          message: 'Compte créé avec succès',
        },
      });
    },
  });

  // Refresh access token
  fastify.post('/refresh', {
    preValidation: fastify.csrfProtection,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const refreshToken = request.cookies['refresh-token'];

        if (!refreshToken) {
          return reply
            .status(401)
            .send({ error: 'Token de rafraîchissement manquant' });
        }

        const decoded = await (fastify as unknown as { refreshJwt: { verify: (token: string) => Promise<any> } }).refreshJwt.verify(refreshToken);

        // CRITICAL: Check if token is revoked
        const isRevoked = await fastify.cache.get(`denylist:${decoded.jti}`);
        if (isRevoked) {
          // Clear cookies if a revoked token is used
          reply
            .clearCookie('access-token', { path: '/' })
            .clearCookie('refresh-token', { path: '/api/auth/refresh' });
          return reply.status(401).send({ error: 'Token révoqué' });
        }

        const payload = {
          studentId: decoded.studentId,
          email: decoded.email,
          role: decoded.role, // Ensure role is included in the new token
        };
        const newAccessToken = await reply.jwtSign(payload, {
          expiresIn: '15m',
        });

        reply.setCookie('access-token', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 15 * 60,
        });

        return reply.send({
          success: true,
          message: 'Token rafraîchi avec succès',
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        fastify.log.error({ err }, 'Token refresh error');
        // Clear potentially invalid cookie
        reply.clearCookie('refresh-token', { path: '/api/auth/refresh' });
        return reply
          .status(401)
          .send({ error: 'Token de rafraîchissement invalide ou expiré' });
      }
    },
  });

  // Password reset request
  fastify.post('/password-reset', {
    schema: authSchemas.passwordReset,
    preValidation: fastify.csrfProtection,
    handler: async (
      request: FastifyRequest<{ Body: PasswordResetBody }>,
      reply: FastifyReply
    ) => {
      const { email } = request.body;

      try {
        await authService.generatePasswordResetToken(email);
        
        // Always return success to prevent email enumeration
        return reply.send({
          success: true,
          data: {
            message: 'Si cette adresse email existe, un lien de réinitialisation a été envoyé.'
          },
        });

        // In production, send email with reset token
        // await emailService.sendPasswordReset(email, resetToken);

      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        fastify.log.error({ err }, 'Password reset error');
        // Do not send 500 to prevent leaking information
        return reply.send({
          success: true,
          data: {
            message: 'Si cette adresse email existe, un lien de réinitialisation a été envoyé.'
          },
        });
      }
    }
  });

  // Password reset confirmation
  fastify.post('/password-reset/confirm', {
    schema: authSchemas.passwordResetConfirm,
    preValidation: fastify.csrfProtection,
    handler: async (
      request: FastifyRequest<{ Body: PasswordResetConfirmBody }>,
      reply: FastifyReply
    ) => {
      const { token, newPassword } = request.body;

      try {
        const success = await authService.resetPassword(token, newPassword);

        if (!success) {
          return reply.status(400).send({
            success: false,
            error: {
              message: 'Token de réinitialisation invalide ou expiré',
              code: 'INVALID_RESET_TOKEN',
            },
          });
        }

        return reply.send({
          success: true,
          data: {
            message: 'Mot de passe réinitialisé avec succès'
          },
        });

      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        fastify.log.error({ err }, 'Password reset confirm error');
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la réinitialisation du mot de passe',
            code: 'INTERNAL_ERROR',
          },
        });
      }
    }
  });

  // 🔒 SECURE LOGOUT - Blacklist tokens
  fastify.post('/logout', {
    preHandler: [fastify.authenticate],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const token = request.headers.authorization?.replace('Bearer ', '');
        if (!token) throw new Error('No token');

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        // 🔥 CRITICAL: Blacklist token - prevents token reuse
        const cacheService = (serviceContainer as any).get?.('cacheService');
        if (cacheService) {
          await cacheService.set(
            `blacklist:${decoded.jti || decoded.studentId}`,
            '1',
            604800 // 7 days
          );
        }

        fastify.log.info({ userId: decoded.studentId || decoded.id }, 'User logged out securely');

        // Clear cookies
        reply
          .clearCookie('access-token', { path: '/' })
          .clearCookie('refresh-token', { path: '/api/auth/refresh' });

        return {
          success: true,
          message: 'Déconnexion réussie'
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        fastify.log.error({ err }, 'Logout failed');
        return reply.status(500).send({
          success: false,
          error: 'Échec de la déconnexion'
        });
      }
    },
  });


  // Get current user info
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
    handler: async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      // The user object is decorated by the authenticate middleware
      const user = (request as AuthenticatedRequest).user;
      const csrfToken = await reply.generateCsrf();

      return reply.send({
        success: true,
        data: {
          student: {
            id: user.studentId,
            email: user.email
            // Add other safe user data from a dedicated user service
          },
          csrfToken,
        },
      });
    }
  });

  // Health endpoint for authentication service
  fastify.get('/health', {
    schema: authSchemas.health,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      // Basic health check, can be expanded
      return reply.send({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString()
        }
      });
    }
  });

  // This endpoint seems for testing/verification, should be secured or removed
  fastify.get('/verify/:studentId', {
    preHandler: [(fastify as unknown as { authenticateAdmin: any }).authenticateAdmin], // Secure this endpoint
    handler: async (
      request: FastifyRequest<{ Params: { studentId: string } }>,
      reply: FastifyReply
    ) => {
      const { studentId } = request.params;

      // Production logic should fetch student data securely
      // This is a placeholder and should be implemented properly
      const id = parseInt(studentId);
      if (isNaN(id)) {
        return reply.status(400).send({ error: 'Invalid student ID' });
      }

      // Example:
      // const student = await studentService.findById(id);
      // if (!student) return reply.status(404).send({ error: 'Student not found' });

      return reply.status(501).send({
        success: false,
        error: {
          message: 'Production logic not implemented',
          code: 'NOT_IMPLEMENTED'
        }
      });
    }
  });
}