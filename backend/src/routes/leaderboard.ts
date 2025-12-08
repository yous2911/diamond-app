/**
 * 🏆 Leaderboard Routes
 * 
 * Endpoints for accessing leaderboards, competitions, and badges
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { leaderboardService } from '../services/leaderboard.service';
import { z } from 'zod';
import { addLeaderboardUpdateJob, scheduleRecurringLeaderboardUpdate } from '../jobs/producers/leaderboard.producer';

// Request schemas
const LeaderboardQuerySchema = z.object({
  type: z.enum(['global', 'class', 'weekly', 'monthly']).default('global'),
  category: z.enum(['points', 'streak', 'exercises', 'accuracy']).default('points'),
  limit: z.coerce.number().min(1).max(100).default(50),
  classId: z.coerce.number().optional(),
  period: z.string().optional()
});

const StudentRankQuerySchema = z.object({
  type: z.enum(['global', 'class', 'weekly', 'monthly']).default('global'),
  category: z.enum(['points', 'streak', 'exercises', 'accuracy']).default('points')
});

const NearbyCompetitorsSchema = z.object({
  type: z.enum(['global', 'class', 'weekly', 'monthly']).default('global'),
  category: z.enum(['points', 'streak', 'exercises', 'accuracy']).default('points'),
  range: z.coerce.number().min(1).max(20).default(5)
});

export default async function leaderboardRoutes(fastify: FastifyInstance): Promise<void> {

  /**
   * 🏆 GET /api/leaderboards - Get leaderboard rankings
   */
  fastify.get('/api/leaderboards', {
    schema: {
      description: 'Get leaderboard rankings',
      tags: ['Leaderboards'],
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['global', 'class', 'weekly', 'monthly'] },
          category: { type: 'string', enum: ['points', 'streak', 'exercises', 'accuracy'] },
          limit: { type: 'number', minimum: 1, maximum: 100 },
          classId: { type: 'number' },
          period: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                entries: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      studentId: { type: 'number' },
                      rank: { type: 'number' },
                      score: { type: 'number' },
                      rankChange: { type: 'number' },
                      student: {
                        type: 'object',
                        properties: {
                          prenom: { type: 'string' },
                          nom: { type: 'string' },
                          mascotteType: { type: 'string' },
                          mascotteColor: { type: 'string' },
                          niveauScolaire: { type: 'string' }
                        }
                      },
                      badges: { type: 'array' },
                      streak: { type: 'number' }
                    }
                  }
                },
                stats: {
                  type: 'object',
                  properties: {
                    totalParticipants: { type: 'number' },
                    averageScore: { type: 'number' },
                    topScore: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = LeaderboardQuerySchema.parse(request.query);
      
      // Get student ID from auth if available
      const studentId = (request as any).user?.studentId;
      
      const result = await leaderboardService.getLeaderboard(
        query.type,
        query.category,
        {
          limit: query.limit,
          classId: query.classId,
          studentId,
          period: query.period
        }
      );

      reply.send({
        success: true,
        data: result,
        message: `${query.type} ${query.category} leaderboard retrieved successfully`
      });

    } catch (error: unknown) {
      (fastify.log as any).error('Error fetching leaderboard:', error);
      reply.code(500).send({
        success: false,
        message: 'Error fetching leaderboard data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * 🎯 GET /api/leaderboards/student/:studentId/rank - Get student's rank
   */
  fastify.get('/api/leaderboards/student/:studentId/rank', {
    schema: {
      description: 'Get student rank in leaderboards',
      tags: ['Leaderboards'],
      params: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'number' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['global', 'class', 'weekly', 'monthly'] },
          category: { type: 'string', enum: ['points', 'streak', 'exercises', 'accuracy'] }
        }
      }
    }
  }, async (request: FastifyRequest<{ 
    Params: { studentId: number };
    Querystring: any;
  }>, reply: FastifyReply) => {
    try {
      const { studentId } = request.params;
      const query = StudentRankQuerySchema.parse(request.query);

      const rank = await leaderboardService.getStudentRank(
        studentId,
        query.type,
        query.category
      );

      if (!rank) {
        reply.code(404).send({
          success: false,
          message: 'Student not found in this leaderboard'
        });
        return;
      }

      reply.send({
        success: true,
        data: rank,
        message: 'Student rank retrieved successfully'
      });

    } catch (error: unknown) {
      (fastify.log as any).error('Error fetching student rank:', error);
      reply.code(500).send({
        success: false,
        message: 'Error fetching student rank',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * 🎯 GET /api/leaderboards/user-centric/:studentId - Get user-centric leaderboard view
   */
  fastify.get('/api/leaderboards/user-centric/:studentId', {
    schema: {
      description: 'Get user-centric leaderboard (student + nearby competitors)',
      tags: ['Leaderboards'],
      params: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'number' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['global', 'class', 'weekly', 'monthly'] },
          category: { type: 'string', enum: ['points', 'streak', 'exercises', 'accuracy'] },
          range: { type: 'number', minimum: 1, maximum: 10 }
        }
      }
    }
  }, async (request: FastifyRequest<{
    Params: { studentId: number };
    Querystring: any;
  }>, reply: FastifyReply) => {
    try {
      const { studentId } = request.params;
      const queryParams = request.query as any;
      const query = {
        type: queryParams?.type || 'global',
        category: queryParams?.category || 'points',
        range: queryParams?.range || 3
      };

      const userCentricView = await leaderboardService.getUserCentricLeaderboard(
        studentId,
        query.type,
        query.category,
        query.range
      );

      reply.send({
        success: true,
        data: userCentricView,
        message: 'User-centric leaderboard retrieved successfully'
      });

    } catch (error: unknown) {
      (fastify.log as any).error('Error fetching user-centric leaderboard:', error);
      reply.code(500).send({
        success: false,
        message: 'Error fetching user-centric leaderboard',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * 🤝 GET /api/leaderboards/student/:studentId/competitors - Get nearby competitors
   */
  fastify.get('/api/leaderboards/student/:studentId/competitors', {
    schema: {
      description: 'Get nearby competitors for a student',
      tags: ['Leaderboards'],
      params: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'number' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['global', 'class', 'weekly', 'monthly'] },
          category: { type: 'string', enum: ['points', 'streak', 'exercises', 'accuracy'] },
          range: { type: 'number', minimum: 1, maximum: 20 }
        }
      }
    }
  }, async (request: FastifyRequest<{
    Params: { studentId: number };
    Querystring: any;
  }>, reply: FastifyReply) => {
    try {
      const { studentId } = request.params;
      const query = NearbyCompetitorsSchema.parse(request.query);

      const competitors = await leaderboardService.getNearbyCompetitors(
        studentId,
        query.type,
        query.category,
        query.range
      );

      reply.send({
        success: true,
        data: competitors,
        message: 'Nearby competitors retrieved successfully'
      });

    } catch (error: unknown) {
      (fastify.log as any).error('Error fetching competitors:', error);
      reply.code(500).send({
        success: false,
        message: 'Error fetching nearby competitors',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * 🏅 GET /api/badges/student/:studentId - Get student badges
   */
  fastify.get('/api/badges/student/:studentId', {
    schema: {
      description: 'Get student badges and achievements',
      tags: ['Badges'],
      params: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'number' }
        }
      }
    }
  }, async (request: FastifyRequest<{
    Params: { studentId: number }
  }>, reply: FastifyReply) => {
    try {
      const { studentId } = request.params;

      // This would be implemented in the leaderboard service
      // For now, let's create a simple response
      const badges = [
        {
          id: 1,
          badgeType: 'first_exercise',
          title: '🎯 Premier Exercice',
          description: 'Félicitations pour votre premier exercice !',
          rarity: 'common',
          earnedAt: new Date()
        }
      ];

      reply.send({
        success: true,
        data: badges,
        message: 'Student badges retrieved successfully'
      });

    } catch (error: unknown) {
      (fastify.log as any).error('Error fetching student badges:', error);
      reply.code(500).send({
        success: false,
        message: 'Error fetching student badges',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * 🔄 POST /api/leaderboards/update - Manual leaderboard update (admin only)
   */
  fastify.post('/api/leaderboards/update', {
    schema: {
      description: 'Manually update all leaderboards',
      tags: ['Leaderboards', 'Admin'],
      response: {
        202: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            jobId: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // In a real app, you'd check for admin permissions here
      // await checkAdminPermission(request);

      const job = await addLeaderboardUpdateJob();

      // Return 202 Accepted to indicate the job has been queued
      reply.code(202).send({
        success: true,
        message: 'Leaderboard update job has been queued.',
        jobId: job?.id
      });

    } catch (error: unknown) {
      (fastify.log as any).error('Error updating leaderboards:', error);
      reply.code(500).send({
        success: false,
        message: 'Error updating leaderboards',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * 📊 GET /api/leaderboards/stats - Get overall leaderboard statistics
   */
  fastify.get('/api/leaderboards/stats', {
    schema: {
      description: 'Get overall leaderboard statistics',
      tags: ['Leaderboards'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalParticipants: { type: 'number' },
                totalBadgesEarned: { type: 'number' },
                averageStreak: { type: 'number' },
                topStreaks: { type: 'array' },
                recentAchievements: { type: 'array' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get basic stats
      const stats = {
        totalParticipants: 150,
        totalBadgesEarned: 847,
        averageStreak: 3.2,
        topStreaks: [
          { studentName: 'Emma M.', streak: 25, mascot: '🦄' },
          { studentName: 'Lucas B.', streak: 19, mascot: '🐉' },
          { studentName: 'Sophie D.', streak: 17, mascot: '🦊' }
        ],
        recentAchievements: [
          {
            studentName: 'Alice R.',
            badge: '👑 Champion Hebdomadaire',
            earnedAt: new Date(Date.now() - 3600000) // 1 hour ago
          },
          {
            studentName: 'Thomas L.',
            badge: '🔥 Série de 10 jours',
            earnedAt: new Date(Date.now() - 7200000) // 2 hours ago
          }
        ]
      };

      reply.send({
        success: true,
        data: stats,
        message: 'Leaderboard statistics retrieved successfully'
      });

    } catch (error: unknown) {
      (fastify.log as any).error('Error fetching leaderboard stats:', error);
      reply.code(500).send({
        success: false,
        message: 'Error fetching statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * 🎮 GET /api/competitions - Get active competitions
   */
  fastify.get('/api/competitions', {
    schema: {
      description: 'Get active competitions and challenges',
      tags: ['Competitions'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Mock competitions data - would come from database
      const competitions = [
        {
          id: 1,
          name: '🚀 Défi de la Semaine',
          description: 'Complétez 20 exercices cette semaine !',
          type: 'weekly_challenge',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          participants: 89,
          rewards: ['🏆 Badge Spécial', '💎 100 Points Bonus'],
          progress: {
            current: 12,
            target: 20,
            percentage: 60
          }
        },
        {
          id: 2,
          name: '⚡ Marathon Mathématique',
          description: 'Résolvez un maximum d\'exercices de maths !',
          type: 'monthly_competition',
          startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          participants: 234,
          rewards: ['👑 Couronne Dorée', '🎁 Surprise Spéciale'],
          progress: {
            current: 45,
            target: 100,
            percentage: 45
          }
        }
      ];

      reply.send({
        success: true,
        data: competitions,
        message: 'Active competitions retrieved successfully'
      });

    } catch (error: unknown) {
      (fastify.log as any).error('Error fetching competitions:', error);
      reply.code(500).send({
        success: false,
        message: 'Error fetching competitions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Schedule the recurring job when the plugin is loaded (only in production)
  if (process.env.NODE_ENV === 'production') {
    scheduleRecurringLeaderboardUpdate();
  }

  (fastify.log as any).info('✅ Leaderboard routes registered successfully');
}