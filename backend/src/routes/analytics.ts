import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { analyticsService } from '../services/analytics.service';
import { databaseService } from '../services/enhanced-database.service';

export default async function analyticsRoutes(fastify: FastifyInstance): Promise<void> {

  // Performance analytics endpoint
  fastify.post('/performance', {
    schema: {
      body: {
        type: 'object',
        properties: {
          metrics: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                metric: { type: 'object' },
                url: { type: 'string' },
                userAgent: { type: 'string' },
                timestamp: { type: 'number' },
                userId: { type: 'string' },
                sessionId: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { metrics } = request.body as { metrics: any[] };
      
      (fastify.log as any).info('Performance metrics received', { 
        count: metrics.length,
        sessionId: metrics[0]?.sessionId 
      });

      return reply.send({
        success: true,
        message: 'Performance metrics received',
        count: metrics.length
      });
    } catch (error: unknown) {
      (fastify.log as any).error('Performance analytics error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to process performance metrics',
          code: 'ANALYTICS_ERROR'
        }
      });
    }
  });

  // Get student analytics
  fastify.get('/student/:studentId/progress', {
    preHandler: fastify.authenticate,
    schema: {
      params: {
        type: 'object',
        properties: {
          studentId: { type: 'number' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { studentId } = request.params as { studentId: number };
      
      const progress = await analyticsService.getStudentAnalytics(studentId);

      return reply.send({
        success: true,
        data: progress
      });
    } catch (error: unknown) {
      (fastify.log as any).error('Get student progress analytics error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to get student progress',
          code: 'ANALYTICS_ERROR'
        }
      });
    }
  });

  // Get student session stats
  fastify.get('/student/:studentId/sessions', {
    preHandler: fastify.authenticate,
    schema: {
      params: {
        type: 'object',
        properties: {
          studentId: { type: 'number' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'number', default: 30 }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { studentId } = request.params as { studentId: number };
      const { days } = request.query as { days?: number };
      
      const stats = await analyticsService.getLearningInsights('month');

      return reply.send({
        success: true,
        data: stats
      });
    } catch (error: unknown) {
      (fastify.log as any).error('Get student session stats error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to get student session stats',
          code: 'ANALYTICS_ERROR'
        }
      });
    }
  });

  // Get exercise completion rate
  fastify.get('/exercise/:exerciseId/completion', {
    schema: {
      params: {
        type: 'object',
        properties: {
          exerciseId: { type: 'number' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { exerciseId } = request.params as { exerciseId: number };
      
      const completion = await analyticsService.getLearningInsights('month');

      return reply.send({
        success: true,
        data: completion
      });
    } catch (error: unknown) {
      (fastify.log as any).error('Get exercise completion rate error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to get exercise completion rate',
          code: 'ANALYTICS_ERROR'
        }
      });
    }
  });

  // Get comprehensive analytics
  fastify.get('/comprehensive', {
    preHandler: fastify.authenticate,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          studentId: { type: 'number' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          matiere: { type: 'string' },
          groupBy: { type: 'string', enum: ['day', 'week', 'month'] },
          limit: { type: 'number', default: 100 },
          offset: { type: 'number', default: 0 }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const {
        studentId,
        startDate,
        endDate,
        matiere,
        groupBy,
        limit,
        offset
      } = request.query as {
        studentId?: number;
        startDate?: string;
        endDate?: string;
        matiere?: string;
        groupBy?: 'day' | 'week' | 'month';
        limit?: number;
        offset?: number;
      };

      // Get analytics data using the new service
      const analyticsData = await databaseService.getDailyLearningAnalytics({
        studentId,
        startDate,
        endDate,
        matiere,
        groupBy,
        limit,
        offset
      });

      // Calculate aggregated metrics
      const aggregatedMetrics = {
        totalDays: analyticsData.length,
        totalSessionTime: analyticsData.reduce((sum, day) => sum + (day.totalTimeMinutes || 0), 0),
        totalExercises: analyticsData.reduce((sum, day) => sum + (day.totalExercises || 0), 0),
        totalCompletedExercises: analyticsData.reduce((sum, day) => sum + (day.completedExercises || 0), 0),
        averageScore: analyticsData.length > 0 ? 
          analyticsData.reduce((sum, day) => sum + parseFloat((day.averageScore ?? 0).toString()), 0) / analyticsData.length : 0,
        totalXpEarned: 0,
        totalCompetencesMastered: analyticsData.reduce((sum, day) => sum + (day.competencesWorked || 0), 0),
        maxStreakDays: 0,
        completionRate: analyticsData.length > 0 ? 
          analyticsData.reduce((sum, day) => sum + (day.completedExercises || 0), 0) / 
          Math.max(analyticsData.reduce((sum, day) => sum + (day.totalExercises || 0), 0), 1) * 100 : 0
      };

      return reply.send({
        success: true,
        data: {
          analytics: analyticsData.map(day => ({
            date: day.date,
            sessionTime: day.totalTimeMinutes || 0,
            exercisesAttempted: day.totalExercises || 0,
            exercisesCompleted: day.completedExercises || 0,
            averageScore: parseFloat((day.averageScore ?? 0).toString()),
            xpEarned: 0,
            competencesMastered: day.competencesWorked || 0,
            competencesProgressed: day.competencesWorked || 0,
            streakDays: 0
          })),
          aggregatedMetrics,
          trends: null
        }
      });
    } catch (error: unknown) {
      (fastify.log as any).error('Get comprehensive analytics error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to get comprehensive analytics',
          code: 'ANALYTICS_ERROR'
        }
      });
    }
  });

  // Get session analytics
  fastify.get('/sessions', {
    preHandler: fastify.authenticate,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          studentId: { type: 'number' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          limit: { type: 'number', default: 50 },
          offset: { type: 'number', default: 0 }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const {
        studentId,
        startDate,
        endDate,
        limit,
        offset
      } = request.query as {
        studentId?: number;
        startDate?: string;
        endDate?: string;
        limit?: number;
        offset?: number;
      };

      // Get session data using the new service
      const sessionData = await databaseService.getLearningSessionTracking({
        studentId,
        startDate,
        endDate,
        limit,
        offset
      });

      // Format response
      const formattedSessions = sessionData.map(session => ({
        id: session.id,
        studentId: session.studentId,
        sessionStart: session.sessionStart,
        sessionEnd: session.sessionEnd,
        duration: session.sessionEnd ? Math.floor((session.sessionEnd.getTime() - session.sessionStart.getTime()) / 1000) : 0,
        exercisesAttempted: 0,
        exercisesCompleted: 0,
        averageScore: parseFloat((session.averageScore ?? 0).toString()),
        xpEarned: 0,
        focusScore: session.focusTime || 0,
        motivationLevel: 0
      }));

      // Calculate summary statistics
      const summaryStats = {
        totalSessions: formattedSessions.length,
        totalDuration: formattedSessions.reduce((sum, session) => sum + session.duration, 0),
        averageDuration: formattedSessions.length > 0 
          ? formattedSessions.reduce((sum, session) => sum + session.duration, 0) / formattedSessions.length 
          : 0,
        totalExercisesAttempted: 0,
        totalExercisesCompleted: 0,
        overallCompletionRate: 0,
        averageScore: formattedSessions.length > 0
          ? formattedSessions.reduce((sum, session) => sum + (session.averageScore ?? 0), 0) / formattedSessions.length
          : 0,
        totalXpEarned: 0,
        averageFocusScore: formattedSessions.length > 0
          ? formattedSessions.reduce((sum, session) => sum + session.focusScore, 0) / formattedSessions.length
          : 0
      };

      return reply.send({
        success: true,
        data: {
          sessions: formattedSessions,
          summary: summaryStats,
          pagination: {
            limit,
            offset,
            total: formattedSessions.length
          }
        }
      });
    } catch (error: unknown) {
      (fastify.log as any).error('Get session analytics error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to get session analytics',
          code: 'ANALYTICS_ERROR'
        }
      });
    }
  });
}