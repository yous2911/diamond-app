/**
 * PARENT DASHBOARD API ROUTES
 * Provides comprehensive analytics and insights for parents
 * Integrates with existing SuperMemo, XP, and competency tracking systems
 */

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq, and, desc, gte, lte, count, avg, sum } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { 
  students, 
  parents,
  parentStudentRelations,
  sessions, 
  exercises, 
  studentProgress,
  studentCompetenceProgress,
  studentAchievements 
} from '../db/schema.js';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const GetChildrenSchema = z.object({
  parentId: z.number().int().positive()
});

const GetChildAnalyticsSchema = z.object({
  childId: z.number().int().positive(),
  timeframe: z.enum(['week', 'month', 'year']).default('week')
});

const GetSuperMemoStatsSchema = z.object({
  childId: z.number().int().positive(),
  days: z.number().int().min(1).max(365).default(30)
});

// =============================================================================
// PARENT DASHBOARD ROUTES
// =============================================================================

const parentsRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Get all children for a parent
  fastify.get('/children/:parentId', {
    schema: {
      params: GetChildrenSchema,
      response: {
        200: z.array(z.object({
          id: z.number(),
          name: z.string(),
          age: z.number(),
          level: z.string(),
          avatar: z.string(),
          totalXP: z.number(),
          currentStreak: z.number(),
          completedExercises: z.number(),
          masteredCompetencies: z.number(),
          currentLevel: z.number(),
          lastActivity: z.string()
        }))
      }
    }
  }, async (request: FastifyRequest<{ Params: z.infer<typeof GetChildrenSchema> }>, reply: FastifyReply) => {
    try {
      const { parentId } = request.params;

      // Get all children for the parent through the relationship table
      const children = await db
        .select({
          id: students.id,
          prenom: students.prenom,
          nom: students.nom,
          dateNaissance: students.dateNaissance,
          niveau: students.niveauActuel,
          totalXP: students.xp,
          currentStreak: students.serieJours,
          currentLevel: students.xp, // Calculate level from XP
          lastLogin: students.dernierAcces
        })
        .from(students)
        .innerJoin(parentStudentRelations, eq(students.id, parentStudentRelations.studentId))
        .where(eq(parentStudentRelations.parentId, parentId));

      // For each child, get additional stats
      const childrenWithStats = await Promise.all(
        children.map(async (child) => {
          // Get completed exercises count
          const [exerciseStats] = await db
            .select({ count: count(studentProgress.id) })
            .from(studentProgress)
            .where(and(
              eq(studentProgress.studentId, child.id),
              eq(studentProgress.completed, true)
            ));

          // Get mastered competencies count
          const [competencyStats] = await db
            .select({ count: count(studentCompetenceProgress.id) })
            .from(studentCompetenceProgress)
            .where(and(
              eq(studentCompetenceProgress.studentId, child.id),
              eq(studentCompetenceProgress.masteryLevel, 'maitrise')
            ));

          // Calculate age from date of birth
          const age = child.dateNaissance 
            ? Math.floor((Date.now() - new Date(child.dateNaissance).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            : 7;

          return {
            id: child.id,
            name: `${child.prenom} ${child.nom}`,
            age,
            level: child.niveau,
            avatar: '👧', // Default avatar, could be stored in DB
            totalXP: child.totalXP || 0,
            currentStreak: child.currentStreak || 0,
            completedExercises: exerciseStats.count || 0,
            masteredCompetencies: competencyStats.count || 0,
            currentLevel: child.currentLevel || 1,
            lastActivity: child.lastLogin?.toISOString() || new Date().toISOString()
          };
        })
      );

      return reply.code(200).send(childrenWithStats);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      fastify.log.error({ err }, 'Error fetching children');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get detailed analytics for a specific child
  fastify.get('/analytics/:childId', {
    schema: {
      params: z.object({ childId: z.string() }),
      querystring: z.object({ 
        timeframe: z.enum(['week', 'month', 'year']).default('week') 
      })
      // Response schema removed - Fastify expects JSON Schema format, not Zod
      // Response validation is disabled by default in the validation plugin
    }
  }, async (request: FastifyRequest<{ 
    Params: { childId: string }, 
    Querystring: { timeframe: 'week' | 'month' | 'year' } 
  }>, reply: FastifyReply) => {
    try {
      const childId = parseInt(request.params.childId);
      const { timeframe } = request.query;

      // Calculate date range based on timeframe
      const now = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Get weekly progress (7 days of data)
      const weeklyProgress = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date();
        dayStart.setDate(now.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        // Get exercises completed by this student on this day
        const completedExercises = await db
          .select({
            exerciseId: studentProgress.exerciseId,
            averageScore: studentProgress.averageScore,
            completedAt: studentProgress.completedAt
          })
          .from(studentProgress)
          .where(and(
            eq(studentProgress.studentId, childId),
            eq(studentProgress.completed, true),
            gte(studentProgress.completedAt || studentProgress.updatedAt, dayStart),
            lte(studentProgress.completedAt || studentProgress.updatedAt, dayEnd)
          ));

        const dayStats = {
          count: completedExercises.length,
          avgScore: completedExercises.length > 0 
            ? completedExercises.reduce((sum, e) => sum + parseFloat((e.averageScore ?? 0).toString()), 0) / completedExercises.length 
            : 0
        };

        // Convert to percentage (assuming 100% is 10 exercises with 90%+ score)
        const score = dayStats.avgScore || 0;
        const exerciseCount = dayStats.count || 0;
        const progressPercent = Math.min(100, (exerciseCount * (score / 100)) * 10);
        
        weeklyProgress.push(Math.round(progressPercent));
      }

      // Get recent achievements
      const achievements = await db
        .select({
          id: studentAchievements.id,
          achievementType: studentAchievements.achievementType,
          title: studentAchievements.title,
          description: studentAchievements.description,
          earnedAt: studentAchievements.unlockedAt
        })
        .from(studentAchievements)
        .where(eq(studentAchievements.studentId, childId))
        .orderBy(desc(studentAchievements.unlockedAt))
        .limit(5);

      const recentAchievements = achievements.map((ach, index) => ({
        id: ach.id,
        title: ach.title || (ach.achievementType === 'streak' ? 'Série de jours' : 
               ach.achievementType === 'level_up' ? 'Niveau supérieur!' :
               ach.achievementType === 'competency_master' ? 'Compétence maîtrisée' :
               'Récompense spéciale'),
        description: ach.description || 'Achievement débloqué',
        icon: ach.achievementType === 'streak' ? '🔥' :
              ach.achievementType === 'level_up' ? '⭐' :
              ach.achievementType === 'competency_master' ? '🎯' : '🏆',
        date: ach.earnedAt.toISOString(),
        color: ['bg-blue-500', 'bg-orange-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'][index % 5]
      }));

      // Get competency progress by domain
      const competencyProgress = await db
        .select({
          competencyCode: studentCompetenceProgress.competenceCode,
          masteryLevel: studentCompetenceProgress.masteryLevel,
          practiceCount: studentCompetenceProgress.progressPercent
        })
        .from(studentCompetenceProgress)
        .where(eq(studentCompetenceProgress.studentId, childId));

      // Group by domain (first 2 characters of competency code)
      const domainStats: Record<string, { total: number, mastered: number, avgMastery: number }> = {};
      
      competencyProgress.forEach(comp => {
        const domain = comp.competencyCode.substring(0, 2);
        const domainName = domain === 'FR' ? 'Français' : 
                          domain === 'MA' ? 'Mathématiques' : 
                          'Découverte du Monde';
                          
        if (!domainStats[domainName]) {
          domainStats[domainName] = { total: 0, mastered: 0, avgMastery: 0 };
        }
        
        // Convert masteryLevel string to number (decouverte=0, apprentissage=0.33, maitrise=0.66, expertise=1.0)
        const masteryLevelMap: Record<string, number> = {
          'decouverte': 0,
          'apprentissage': 0.33,
          'maitrise': 0.66,
          'expertise': 1.0
        };
        const masteryValue = masteryLevelMap[comp.masteryLevel || 'decouverte'] || 0;
        
        domainStats[domainName].total++;
        domainStats[domainName].avgMastery += masteryValue;
        if (masteryValue >= 0.8) {
          domainStats[domainName].mastered++;
        }
      });

      const competencyData = Object.entries(domainStats).map(([domain, stats]) => ({
        domain,
        progress: Math.round((stats.avgMastery / stats.total) * 100),
        total: stats.total,
        mastered: stats.mastered
      }));

      // Calculate learning patterns
      // Note: sessions table only has id, studentId, expiresAt, createdAt
      // We'll use createdAt as session start and expiresAt as session end
      const sessionData = await db
        .select({
          id: sessions.id,
          createdAt: sessions.createdAt,
          expiresAt: sessions.expiresAt
        })
        .from(sessions)
        .where(and(
          eq(sessions.studentId, childId),
          gte(sessions.createdAt, startDate)
        ));

      // Calculate average duration from createdAt and expiresAt
      const totalDuration = sessionData.reduce((sum, session) => {
        if (session.expiresAt && session.createdAt) {
          return sum + (session.expiresAt.getTime() - session.createdAt.getTime());
        }
        return sum;
      }, 0);
      const avgDurationMs = sessionData.length > 0 ? totalDuration / sessionData.length : 0;
      const averageSessionMinutes = Math.round(avgDurationMs / 60000) || 15;
      const sessionStats = {
        avgDuration: avgDurationMs,
        totalSessions: sessionData.length
      };

      return reply.code(200).send({
        weeklyProgress,
        recentAchievements,
        competencyProgress: competencyData,
        learningPattern: {
          bestTime: 'Matin (9h-11h)', // Could be calculated from session data
          averageSession: `${averageSessionMinutes} min`,
          preferredSubject: competencyData.length > 0 ? competencyData[0].domain : 'Mathématiques',
          difficultyTrend: 'Progressive'
        }
      });

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      fastify.log.error({ err }, 'Error fetching child analytics');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get SuperMemo algorithm performance stats
  fastify.get('/supermemo/:childId', {
    schema: {
      params: z.object({ childId: z.string() }),
      querystring: z.object({ 
        days: z.string().optional().transform(val => val ? parseInt(val) : 30)
      })
      // Response schema removed - Fastify expects JSON Schema format, not Zod
    }
  }, async (request: FastifyRequest<{ 
    Params: { childId: string }, 
    Querystring: { days?: number } 
  }>, reply: FastifyReply) => {
    try {
      const childId = parseInt(request.params.childId);
      const days = request.query.days || 30;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get SuperMemo performance data from studentProgress
      const progressData = await db
        .select({
          averageScore: studentProgress.averageScore,
          exerciseId: studentProgress.exerciseId,
          completedAt: studentProgress.completedAt
        })
        .from(studentProgress)
        .where(and(
          eq(studentProgress.studentId, childId),
          eq(studentProgress.completed, true),
          gte(studentProgress.completedAt || studentProgress.updatedAt, startDate)
        ));

      const superMemoStats = {
        avgScore: progressData.length > 0 
          ? progressData.reduce((sum, p) => sum + parseFloat((p.averageScore ?? 0).toString()), 0) / progressData.length 
          : 0,
        totalExercises: progressData.length,
        avgDifficulty: 0, // Not available in studentProgress
        successCount: progressData.length // All completed exercises are considered successful
      };

      const retention = superMemoStats.avgScore || 85;
      const totalReviews = superMemoStats.totalExercises || 0;
      const successRate = totalReviews > 0 ? 
        (Number(superMemoStats.successCount) / totalReviews) * 100 : 0;

      return reply.code(200).send({
        retention: Math.round(retention * 10) / 10,
        averageInterval: 4.8, // Mock data - would calculate from SuperMemo intervals
        stabilityIndex: 8.7,   // Mock data - would calculate from memory stability
        retrievalStrength: Math.round((retention / 100) * 100) / 100,
        totalReviews,
        successRate: Math.round(successRate * 10) / 10
      });

    } catch (error: unknown) {
      fastify.log.error(error as Error, 'Error fetching SuperMemo stats');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get detailed progress report (for exports, emails, etc.)
  fastify.get('/report/:childId', {
    schema: {
      params: z.object({ childId: z.string() }),
      querystring: z.object({ 
        format: z.enum(['json', 'pdf', 'email']).default('json'),
        period: z.enum(['week', 'month', 'quarter']).default('month')
      })
    }
  }, async (request: FastifyRequest<{ 
    Params: { childId: string }, 
    Querystring: { format: 'json' | 'pdf' | 'email', period: 'week' | 'month' | 'quarter' } 
  }>, reply: FastifyReply) => {
    try {
      const childId = parseInt(request.params.childId);
      const { format, period } = request.query;

      // This would generate comprehensive reports
      // For now, return structured data that could be used for PDF generation or email
      
      const reportData = {
        childId,
        period,
        generatedAt: new Date().toISOString(),
        summary: {
          totalLearningTime: '12h 30min',
          exercisesCompleted: 89,
          competenciesImproved: 15,
          averageScore: 87.5,
          streakRecord: 12
        },
        achievements: [
          { type: 'Consistency', description: '7 days in a row' },
          { type: 'Mastery', description: 'CP Maths completed' },
          { type: 'Progress', description: 'Level 8 reached' }
        ],
        recommendations: [
          'Continue focus on reading comprehension',
          'Introduce more challenging math problems',
          'Great progress in vocabulary building'
        ]
      };

      return reply.code(200).send(reportData);

    } catch (error: unknown) {
      fastify.log.error(error as Error, 'Error generating report');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

};

export default parentsRoutes;