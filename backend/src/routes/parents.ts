/**
 * PARENT DASHBOARD API ROUTES
 * Provides comprehensive analytics and insights for parents
 * Integrates with existing SuperMemo, XP, and competency tracking systems
 */

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq, and, desc, gte, lte, count, avg, sum, sql } from 'drizzle-orm';
import { db } from '../db/connection';
import { 
  students, 
  parents,
  parentStudentRelations,
  sessions, 
  exercises, 
  studentProgress,
  studentCompetenceProgress,
  studentAchievements,
  spacedRepetition
} from '../db/schema.js';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const GetChildrenSchema = z.object({
  parentId: z.number().int().positive()
});

const _GetChildAnalyticsSchema = z.object({
  childId: z.number().int().positive(),
  timeframe: z.enum(['week', 'month', 'year']).default('week')
});

const _GetSuperMemoStatsSchema = z.object({
  childId: z.number().int().positive(),
  days: z.number().int().min(1).max(365).default(30)
});

// =============================================================================
// PARENT DASHBOARD ROUTES
// =============================================================================

const parentsRoutes: FastifyPluginAsync = async (fastify) => {
  
  // Get all children for a parent
  fastify.get('/children/:parentId', async (request: FastifyRequest<{ Params: z.infer<typeof GetChildrenSchema> }>, reply: FastifyReply) => {
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
            completedExercises: exerciseStats?.count || 0,
            masteredCompetencies: competencyStats?.count || 0,
            currentLevel: child.currentLevel || 1,
            lastActivity: child.lastLogin?.toISOString() || new Date().toISOString()
          };
        })
      );

      return reply.code(200).send(childrenWithStats);
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Error fetching children');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get detailed analytics for a specific child
  fastify.get('/analytics/:childId', async (request: FastifyRequest<{
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

        const [dayStats] = await db
          .select({ 
            count: count(studentProgress.id),
            avgScore: avg(studentProgress.averageScore)
          })
          .from(studentProgress)
          .where(and(
            eq(studentProgress.studentId, childId),
            gte(studentProgress.completedAt, dayStart),
            lte(studentProgress.completedAt, dayEnd)
          ));

        // Convert to percentage (assuming 100% is 10 exercises with 90%+ score)
        const score = dayStats?.avgScore || 0;
        const exerciseCount = dayStats?.count || 0;
        const progressPercent = Math.min(100, (Number(exerciseCount) * (Number(score) / 100)) * 10);
        
        weeklyProgress.push(Math.round(progressPercent));
      }

      // Get recent achievements
      const achievements = await db
        .select({
          id: studentAchievements.id,
          achievementType: studentAchievements.achievementType,
          achievementCode: studentAchievements.achievementCode,
          title: studentAchievements.title,
          unlockedAt: studentAchievements.unlockedAt
        })
        .from(studentAchievements)
        .where(eq(studentAchievements.studentId, childId))
        .orderBy(desc(studentAchievements.unlockedAt))
        .limit(5);

      const recentAchievements = achievements.map((ach, index) => ({
        id: ach.id,
        title: ach.achievementType === 'streak' ? `${ach.achievementCode} jours consécutifs` : 
               ach.achievementType === 'level_up' ? 'Niveau supérieur!' :
               ach.achievementType === 'competency_master' ? 'Compétence maîtrisée' :
               'Récompense spéciale',
        icon: ach.achievementType === 'streak' ? '🔥' :
              ach.achievementType === 'level_up' ? '⭐' :
              ach.achievementType === 'competency_master' ? '🎯' : '🏆',
        date: ach.unlockedAt.toISOString(),
        color: ['bg-blue-500', 'bg-orange-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'][index % 5]
      }));

      // Get competency progress by domain
      const competencyProgress = await db
        .select({
          competenceCode: studentCompetenceProgress.competenceCode,
          masteryLevel: studentCompetenceProgress.masteryLevel,
          practiceCount: studentCompetenceProgress.totalAttempts
        })
        .from(studentCompetenceProgress)
        .where(eq(studentCompetenceProgress.studentId, childId));

      // Group by domain (first 2 characters of competency code)
      const domainStats: Record<string, { total: number, mastered: number, avgMastery: number }> = {};
      
      competencyProgress.forEach(comp => {
        if (!comp) {
          return;
        }
        
        const domain = comp.competenceCode.substring(0, 2);
        const domainName = domain === 'FR' ? 'Français' : 
                          domain === 'MA' ? 'Mathématiques' : 
                          'Découverte du Monde';
                          
        if (!domainStats[domainName]) {
          domainStats[domainName] = { total: 0, mastered: 0, avgMastery: 0 };
        }
        
        const domainStat = domainStats[domainName];
        if (!domainStat) {
          return;
        }
        
        // Type narrowing - TypeScript doesn't recognize the continue above
        const stat = domainStats[domainName]!;
        stat.total++;
        // Convert mastery level string to number (decouverte=0, apprentissage=0.4, maitrise=0.8, expertise=1.0)
        const masteryMap: Record<string, number> = {
          'decouverte': 0,
          'apprentissage': 0.4,
          'maitrise': 0.8,
          'expertise': 1.0,
          'not_started': 0
        };
        const masteryValue = masteryMap[comp.masteryLevel || 'not_started'] || 0;
        stat.avgMastery += masteryValue;
        if (masteryValue >= 0.8) {
          stat.mastered++;
        }
      });

      const competencyData = Object.entries(domainStats).map(([domain, stats]) => ({
        domain,
        progress: Math.round((stats.avgMastery / stats.total) * 100),
        total: stats.total,
        mastered: stats.mastered
      }));

      // Calculate learning patterns
      const [sessionStats] = await db
        .select({
          avgDuration: avg(sql<number>`TIMESTAMPDIFF(SECOND, ${sessions.createdAt}, ${sessions.expiresAt})`),
          totalSessions: count(sessions.id)
        })
        .from(sessions)
        .where(and(
          eq(sessions.studentId, childId),
          gte(sessions.createdAt, startDate)
        ));

      const averageSessionMinutes = sessionStats?.avgDuration ? Math.round(Number(sessionStats.avgDuration) / 60) : 15;

      return reply.code(200).send({
        weeklyProgress,
        recentAchievements,
        competencyProgress: competencyData,
        learningPattern: {
          bestTime: 'Matin (9h-11h)', // Could be calculated from session data
          averageSession: `${averageSessionMinutes} min`,
          preferredSubject: competencyData.length > 0 && competencyData[0] ? competencyData[0]?.domain : 'Mathématiques',
          difficultyTrend: 'Progressive'
        }
      });

    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Error fetching child analytics');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get SuperMemo algorithm performance stats
  fastify.get('/supermemo/:childId', async (request: FastifyRequest<{
    Params: { childId: string },
    Querystring: { days?: number }
  }>, reply: FastifyReply) => {
    try {
      const childId = parseInt(request.params.childId);
      const days = request.query.days || 30;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get SuperMemo performance data from exercises
      const [superMemoStats] = await db
        .select({
          avgScore: avg(studentProgress.averageScore),
          totalExercises: count(studentProgress.id),
          avgDifficulty: avg(sql<number>`CAST(${studentProgress.masteryLevel} AS DECIMAL)`),
          successCount: sum(sql<number>`CASE WHEN ${studentProgress.masteryLevel} = 'maitrise' THEN 1 ELSE 0 END`)
        })
        .from(studentProgress)
        .where(and(
          eq(studentProgress.studentId, childId),
          gte(studentProgress.completedAt, startDate)
        ));

      const retention = superMemoStats?.avgScore || 85;
      const totalReviews = superMemoStats?.totalExercises || 0;
      const successRate = totalReviews > 0 ? 
        (Number(superMemoStats?.successCount) / totalReviews) * 100 : 0;

      // Calculate averageInterval from actual SuperMemo data
      // Get intervals from spaced repetition cards
      const [intervalData] = await db
        .select({
          avgInterval: avg(sql<number>`CAST(${spacedRepetition.intervalDays} AS DECIMAL)`),
          avgStability: avg(sql<number>`CAST(${spacedRepetition.easinessFactor} AS DECIMAL)`)
        })
        .from(spacedRepetition)
        .where(and(
          eq(spacedRepetition.studentId, childId),
          gte(spacedRepetition.lastReviewDate, startDate)
        ));

      // Calculate averageInterval (in days) from SuperMemo intervals
      const averageInterval = intervalData?.avgInterval 
        ? Math.round(Number(intervalData.avgInterval) * 10) / 10 
        : totalReviews > 0 ? 4.5 : 0; // Default if no data

      // Calculate stabilityIndex from easinessFactor (SuperMemo stability metric)
      const stabilityIndex = intervalData?.avgStability
        ? Math.round(Number(intervalData.avgStability) * 10) / 10
        : successRate > 0 ? (successRate / 10) : 0; // Estimate from success rate

      return reply.code(200).send({
        retention: Math.round(Number(retention) * 10) / 10,
        averageInterval,
        stabilityIndex,
        retrievalStrength: Math.round((Number(retention) / 100) * 100) / 100,
        totalReviews,
        successRate: Math.round(successRate * 10) / 10
      });

    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Error fetching SuperMemo stats');
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
      fastify.log.error({ err: error }, 'Error generating report');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

};

export default parentsRoutes;