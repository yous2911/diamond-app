/**
 * PARENT AUTHENTICATION ROUTES
 * Handles parent registration, login, and session management
 * Separate from student authentication system
 */

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { parentAuthService, ParentRegistrationRequest, ParentLoginRequest } from '../services/parent-auth.service.js';

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

const _LinkChildSchema = z.object({
  childId: z.number().int().positive(),
  relationshipType: z.enum(['parent', 'guardian', 'tutor']).default('parent')
});

// =============================================================================
// PARENT AUTH ROUTES
// =============================================================================

const parentAuthRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Parent Registration
  fastify.post('/register', async (request: FastifyRequest<{ Body: z.infer<typeof ParentRegistrationSchema> }>, reply: FastifyReply) => {
    try {
      const result = await parentAuthService.register(request.body as ParentRegistrationRequest);
      
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
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Parent registration error');
      return reply.code(400).send({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la création du compte'
      });
    }
  });

  // Parent Login
  fastify.post('/login', async (request: FastifyRequest<{ Body: z.infer<typeof ParentLoginSchema> }>, reply: FastifyReply) => {
    try {
      const result = await parentAuthService.login(request.body as ParentLoginRequest);
      
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
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Parent login error');
      return reply.code(401).send({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur de connexion'
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
    preHandler: [fastify.authenticate]
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
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Get parent profile error');
      return reply.code(500).send({
        success: false,
        message: 'Erreur lors de la récupération du profil'
      });
    }
  });

  // Link Child to Parent (requires authentication)
  fastify.post('/link-child', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const parentId = (request as any).user?.id;
      if (!parentId) {
        return reply.code(401).send({ success: false, message: 'Non autorisé' });
      }

      const body = request.body as { childId: number; relationshipType: string };
      await parentAuthService.linkChild(parentId, body.childId, body.relationshipType);
      
      return reply.code(200).send({
        success: true,
        message: 'Enfant lié au compte parent avec succès'
      });
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Link child error');
      return reply.code(400).send({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la liaison'
      });
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
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Verify parent token error');
      return reply.code(401).send({
        success: false,
        message: 'Token invalide'
      });
    }
  });
};

export default parentAuthRoutes;