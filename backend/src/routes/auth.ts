
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { authSchemas, loginSchema, registerSchema } from '../schemas/auth.schema';
import { AuthService } from '../services/auth.service';
import { createRateLimitMiddleware } from '../services/rate-limit.service';

// Types will be inferred from Zod schemas, removing manual interfaces
type LoginRequestBody = z.infer<typeof loginSchema>;
type RegisterRequestBody = z.infer<typeof registerSchema>;

interface RefreshTokenBody {
  refreshToken: string;
}

interface PasswordResetBody {
  email: string;
}

interface PasswordResetConfirmBody {
  token: string;
  newPassword: string;
}

export default async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService();

  // Secure login endpoint
  fastify.post('/login', {
    preValidation: async (request, reply) => {
      try {
        request.body = await loginSchema.parseAsync(request.body);
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: {
            message: 'Données invalides',
            code: 'VALIDATION_ERROR',
            details: error instanceof Error ? error.message : 'Erreur de validation'
          }
        });
        return;
      }
    },
    preHandler: [createRateLimitMiddleware('auth:login')],
    handler: async (
      request: FastifyRequest<{ Body: LoginRequestBody }>,
      reply: FastifyReply
    ) => {
      try {
        const authResult = await authService.authenticateStudent(request.body);

        if (!authResult.success || !authResult.student) {
          const statusCode = authResult.lockoutInfo?.isLocked ? 429 : 401;
          return reply.status(statusCode).send({
            success: false,
            error: {
              message: authResult.error,
              code: authResult.lockoutInfo?.isLocked ? 'ACCOUNT_LOCKED' : 'INVALID_CREDENTIALS',
              lockoutInfo: authResult.lockoutInfo,
            },
          });
        }

        const { student } = authResult;
        const payload = { studentId: student.id, email: student.email };

        const accessToken = await reply.jwtSign(payload);
        const refreshToken = await (fastify as any).refreshJwt.sign({ ...payload, type: 'refresh' });

        (reply as any).setAuthCookies(accessToken, refreshToken);

        return reply.send({
          success: true,
          data: {
            token: accessToken,
            student: authResult.student,
          },
        });

      } catch (error) {
        fastify.log.error('Login error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur interne du serveur',
            code: 'INTERNAL_ERROR',
          },
        });
      }
    }
  });

  // Register new student
  fastify.post('/register', {
    preValidation: async (request, reply) => {
      try {
        request.body = await registerSchema.parseAsync(request.body);
      } catch (error) {
        reply.status(400).send({
          success: false,
          error: {
            message: 'Données invalides',
            code: 'VALIDATION_ERROR',
            details: error instanceof Error ? error.message : 'Erreur de validation'
          }
        });
        return;
      }
    },
    preHandler: [createRateLimitMiddleware('auth:register')],
    handler: async (
      request: FastifyRequest<{ Body: RegisterRequestBody }>,
      reply: FastifyReply
    ) => {
      try {
        const authResult = await authService.registerStudent(request.body);

        if (!authResult.success || !authResult.student) {
          return reply.status(400).send({
            success: false,
            error: {
              message: authResult.error,
              code: 'REGISTRATION_FAILED',
            },
          });
        }

        const { student } = authResult;
        const payload = { studentId: student.id, email: student.email };

        const accessToken = await reply.jwtSign(payload);
        const refreshToken = await (fastify as any).refreshJwt.sign({ ...payload, type: 'refresh' });

        (reply as any).setAuthCookies(accessToken, refreshToken);

        return reply.status(201).send({
          success: true,
          data: {
            student: authResult.student,
            token: accessToken,
            message: 'Compte créé avec succès'
          },
        });

      } catch (error) {
        fastify.log.error('Registration error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la création du compte',
            code: 'INTERNAL_ERROR',
          },
        });
      }
    }
  });

  // Refresh access token
  fastify.post('/refresh', {
    schema: authSchemas.refresh,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // The cookie plugin unsigns the cookie automatically
        const refreshToken = request.cookies['refresh-token'];

        if (!refreshToken) {
          return reply.status(401).send({
            success: false,
            error: {
              message: 'Token de rafraîchissement manquant',
              code: 'MISSING_REFRESH_TOKEN',
            },
          });
        }

        const decoded = await (fastify as any).refreshJwt.verify(refreshToken);
        const payload = { studentId: decoded.studentId, email: decoded.email };
        const newAccessToken = await reply.jwtSign(payload);

        // Only set the access token cookie
        (reply as any).setAuthCookies(newAccessToken, refreshToken);

        return reply.send({
          success: true,
          data: {
            token: newAccessToken,
            message: 'Token rafraîchi avec succès',
          },
        });

      } catch (error) {
        fastify.log.error('Token refresh error:', error);
        reply.clearCookie('refresh-token', { path: '/api/auth/refresh' });
        return reply.status(401).send({
          success: false,
          error: {
            message: 'Token de rafraîchissement invalide ou expiré',
            code: 'INVALID_REFRESH_TOKEN',
          },
        });
      }
    }
  });

  // Password reset request
  fastify.post('/password-reset', {
    schema: authSchemas.passwordReset,
    preHandler: [createRateLimitMiddleware('auth:password-reset')],
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
        fastify.log.error('Password reset error:', error);
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
        fastify.log.error('Password reset confirm error:', error);
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

  // Logout endpoint
  fastify.post('/logout', {
    preHandler: [fastify.authenticate],
    handler: async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      try {
        const studentId = (request.user as any).studentId;
        await authService.logoutStudent(studentId);

        (reply as any).clearAuthCookies();

        return reply.send({
          success: true,
          data: {
            message: 'Déconnexion réussie'
          },
        });

      } catch (error) {
        fastify.log.error('Logout error:', error);
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la déconnexion',
            code: 'INTERNAL_ERROR',
          },
        });
      }
    }
  });

  // Get current user info
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
    handler: async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      // The user object is decorated by the authenticate middleware
      const user = request.user as any;

      return reply.send({
        success: true,
        data: {
          student: {
            id: user.studentId,
            email: user.email
            // Add other safe user data from a dedicated user service
          }
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
    preHandler: [fastify.authenticateAdmin], // Secure this endpoint
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
