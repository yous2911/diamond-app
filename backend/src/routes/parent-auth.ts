/**
 * PARENT AUTHENTICATION ROUTES
 * Handles parent registration, login, and session management
 * Separate from student authentication system
 */

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { parentAuthService } from '../services/parent-auth.service.js';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const ParentRegistrationSchema = z.object({
  nom: z.string().min(2).max(100),
  prenom: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  telephone: z.string().optional(),
  childrenIds: z.array(z.number().int().positive()).optional()
});

const ParentLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const LinkChildSchema = z.object({
  childId: z.number().int().positive(),
  relationshipType: z.enum(['parent', 'guardian', 'tutor']).default('parent')
});

// =============================================================================
// PARENT AUTH ROUTES
// =============================================================================

const parentAuthRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Parent Registration
  fastify.post('/register', {
    // schema: {
    //   body: zodToJsonSchema(ParentRegistrationSchema, 'ParentRegistrationSchema'),
    // }
  }, async (request: FastifyRequest<{ Body: z.infer<typeof ParentRegistrationSchema> }>, reply: FastifyReply) => {
    try {
      const result = await parentAuthService.register(request.body);
      
      // Set secure HTTP-only cookie
      reply.setCookie('parent_auth_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });

      return reply.code(201).send({
        success: true,
        message: 'Compte parent créé avec succès',
        parent: {
          id: result.parent.id,
          nom: result.parent.nom,
          prenom: result.parent.prenom,
          email: result.parent.email
        },
        token: result.token,
        children: result.children
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      fastify.log.error({ err }, 'Parent registration error');
      return reply.code(400).send({
        success: false,
        message: err.message
      });
    }
  });

  // Parent Login
  fastify.post('/login', {
    // schema: {
    //   body: zodToJsonSchema(ParentLoginSchema, 'ParentLoginSchema'),
    // }
  }, async (request: FastifyRequest<{ Body: z.infer<typeof ParentLoginSchema> }>, reply: FastifyReply) => {
    try {
      const result = await parentAuthService.login(request.body);
      
      // Set secure HTTP-only cookie
      reply.setCookie('parent_auth_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });

      return reply.code(200).send({
        success: true,
        message: 'Connexion réussie',
        parent: {
          id: result.parent.id,
          nom: result.parent.nom,
          prenom: result.parent.prenom,
          email: result.parent.email
        },
        token: result.token,
        children: result.children
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      fastify.log.error({ err }, 'Parent login error');
      return reply.code(401).send({
        success: false,
        message: err.message
      });
    }
  });

  // Parent Logout
  fastify.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie('parent_auth_token', { path: '/' });
    return reply.code(200).send({
      success: true,
      message: 'Déconnexion réussie'
    });
  });

  // Get Parent Profile (requires authentication)
  fastify.get('/profile', {
    preHandler: [fastify.authenticate],
    // schema: {
    //   response: {
    //     200: z.object({
    //       success: z.boolean(),
    //       parent: z.object({
    //         id: z.number(),
    //         nom: z.string(),
    //         prenom: z.string(),
    //         email: z.string(),
    //         telephone: z.string().nullable(),
    //         dailyReportEnabled: z.boolean(),
    //         weeklyReportEnabled: z.boolean(),
    //         achievementNotificationsEnabled: z.boolean(),
    //         progressAlertsEnabled: z.boolean()
    //       }),
    //       children: z.array(z.object({
    //         id: z.number(),
    //         nom: z.string(),
    //         prenom: z.string(),
    //         niveau: z.string(),
    //         totalXP: z.number().nullable(),
    //         currentStreak: z.number().nullable(),
    //         lastLogin: z.string().nullable()
    //       }))
    //     })
    //   }
    // }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get parent ID from auth context
      const parentId = (request as any).user?.id;
      if (!parentId) {
        return reply.code(401).send({ success: false, message: 'Non autorisé' });
      }

      const result = await parentAuthService.getProfile(parentId);
      
      return reply.code(200).send({
        success: true,
        parent: {
          id: result.parent.id,
          nom: result.parent.nom,
          prenom: result.parent.prenom,
          email: result.parent.email,
          telephone: result.parent.telephone,
          dailyReportEnabled: result.parent.dailyReportEnabled,
          weeklyReportEnabled: result.parent.weeklyReportEnabled,
          achievementNotificationsEnabled: result.parent.achievementNotificationsEnabled,
          progressAlertsEnabled: result.parent.progressAlertsEnabled
        },
        children: result.children.map(child => ({
          id: child.id,
          nom: child.nom,
          prenom: child.prenom,
          niveau: child.niveau,
          totalXP: child.totalXP,
          currentStreak: child.currentStreak,
          lastLogin: child.lastLogin?.toISOString() || null
        }))
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      fastify.log.error({ err }, 'Get parent profile error');
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la récupération du profil'
      });
    }
  });

  // Link Child to Parent (requires authentication)
  fastify.post('/link-child', {
    preHandler: [fastify.authenticate],
    // schema: {
    //   body: LinkChildSchema,
    //   response: {
    //     200: z.object({
    //       success: z.boolean(),
    //       message: z.string()
    //     })
    //   }
    // },
    handler: async (request: FastifyRequest<{ Body: z.infer<typeof LinkChildSchema> }>, reply: FastifyReply) => {
      try {
        const parentId = (request as any).user?.id;
        if (!parentId) {
          reply.code(401).send({ success: false, message: 'Non autorisé' });
          return;
        }

        const body = request.body as { childId: number; relationshipType: string };
        await parentAuthService.linkChild(parentId, body.childId, body.relationshipType);
        
        reply.code(200).send({
          success: true,
          message: 'Enfant lié au compte parent avec succès'
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        fastify.log.error({ err }, 'Link child error');
        reply.code(400).send({
          success: false,
          message: err.message
        });
      }
    }
  });

  // Verify parent token (for API authentication)
  fastify.get('/verify', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      const cookieToken = request.cookies.parent_auth_token;
      
      const token = authHeader?.replace('Bearer ', '') || cookieToken;
      
      if (!token) {
        return reply.code(401).send({ success: false, message: 'Token manquant' });
      }

      const session = await parentAuthService.verifyToken(token);
      
      return reply.code(200).send({
        success: true,
        session
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      fastify.log.error({ err }, 'Verify parent token error');
      return reply.code(401).send({
        success: false,
        message: 'Token invalide'
      });
    }
  });
};

export default parentAuthRoutes;