import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, sql, count, sum, avg } from 'drizzle-orm';
import { exercises, studentProgress, modules, spacedRepetition } from '../db/schema';
import { SuperMemoService, SuperMemoCard } from '../services/supermemo.service';
import { CommonIdParams } from '../schemas/common.schema.js';
import { databaseService } from '../services/enhanced-database.service.js';
import { Type } from '@sinclair/typebox';
import {
  CreateModuleSchema,
  GenerateExercisesSchema,
  GetExercisesSchema,
  CreateExerciseSchema,
  UpdateExerciseSchema,
  AttemptExerciseSchema,
  StudentHistorySchema,
  GetExercisesByLevelSchema,
  GetRandomExercisesSchema,
  GetExerciseStatsSchema,
} from '../schemas/exercise.schema.js';

export default async function exercisesRoutes(fastify: FastifyInstance) {
  // Create module with competence mapping
  fastify.post('/modules', {
    preHandler: [fastify.authenticate],
    preValidation: [fastify.csrfProtection],
    schema: CreateModuleSchema,
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Production logic would go here
      return reply.status(501).send({
        success: false,
        error: { message: 'Not implemented', code: 'NOT_IMPLEMENTED' }
      });
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Create module error');
      return reply.status(500).send({
        success: false,
        error: { message: 'Internal error', code: 'INTERNAL_ERROR' }
      });
    }
  });

  // Generate exercises from competence codes
  fastify.post('/generate', {
    preHandler: [fastify.authenticate],
    preValidation: [fastify.csrfProtection],
    schema: GenerateExercisesSchema,
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Production logic would go here
      return reply.status(501).send({
        success: false,
        error: { message: 'Not implemented', code: 'NOT_IMPLEMENTED' }
      });
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Generate exercises error');
      return reply.status(500).send({
        success: false,
        error: { message: 'Internal error', code: 'INTERNAL_ERROR' }
      });
    }
  });

  // Get exercises with filtering
  fastify.get('/', {
    schema: GetExercisesSchema
  }, async (request: FastifyRequest<{ Querystring: { page?: number; limit?: number; difficulte?: string } }>, reply) => {
      try {
        const {
          page = 1,
          limit = 10,
          difficulte,
        } = request.query as { page?: number; limit?: number; difficulte?: string };

        const offset = (page - 1) * limit;

        const whereConditions = [];
        if (difficulte) {
          whereConditions.push(eq(exercises.difficulte, difficulte));
        }

        const allExercises = await fastify.db
          .select()
          .from(exercises)
          .where(and(...whereConditions))
          .limit(limit)
          .offset(offset);

        return reply.send({
          success: true,
          data: allExercises
        });
      } catch (error: unknown) {
        fastify.log.error({ err: error }, 'Get exercises error');
        return reply.status(500).send({
          success: false,
          error: {
            message: 'Erreur lors de la récupération des exercices',
            code: 'GET_EXERCISES_ERROR',
          },
        });
      }
  });

  // Create exercise
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    preValidation: [fastify.csrfProtection],
    schema: CreateExerciseSchema,
  }, async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Production logic would go here
      return reply.status(501).send({
        success: false,
        error: { message: 'Not implemented', code: 'NOT_IMPLEMENTED' }
      });
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Create exercise error');
      return reply.status(500).send({
        success: false,
        error: { message: 'Internal error', code: 'INTERNAL_ERROR' }
      });
    }
  });

  // Update exercise
  fastify.put('/:id', {
    preHandler: [fastify.authenticate],
    preValidation: [fastify.csrfProtection],
    schema: UpdateExerciseSchema,
  }, async (_request, reply) => {
    try {
      // Production logic would go here
      return reply.status(501).send({
        success: false,
        error: { message: 'Not implemented', code: 'NOT_IMPLEMENTED' }
      });
      } catch (error: unknown) {
        fastify.log.error({ err: error }, 'Update exercise error');
      return reply.status(500).send({
        success: false,
        error: { message: 'Internal error', code: 'INTERNAL_ERROR' }
      });
    }
  });

  // Delete exercise
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
    preValidation: [fastify.csrfProtection],
    schema: { params: CommonIdParams },
  }, async (_request, reply) => {
    try {
      // Production logic would go here
      return reply.status(501).send({
        success: false,
        error: { message: 'Not implemented', code: 'NOT_IMPLEMENTED' }
      });
      } catch (error: unknown) {
        fastify.log.error({ err: error }, 'Delete exercise error');
      return reply.status(500).send({
        success: false,
        error: { message: 'Internal error', code: 'INTERNAL_ERROR' }
      });
    }
  });

  // Get exercise recommendations for a student
  fastify.get('/recommendations/:studentId', {
    preHandler: [fastify.authenticate],
    schema: {
      params: CommonIdParams,
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
        },
      },
    },
  }, async (_request: FastifyRequest, _reply: FastifyReply) => {
    // ...
  });

  // Get exercises by module
  fastify.get('/by-module/:moduleId', {
    preHandler: [fastify.authenticate],
    schema: {
      params: CommonIdParams,
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 20 },
          offset: { type: 'integer', default: 0 },
        },
      },
    },
  }, async (_request: FastifyRequest, _reply: FastifyReply) => {
    // ...
  });

  // Submit exercise attempt with SuperMemo-2 integration
  fastify.post('/attempt', {
    preHandler: [fastify.authenticate],
    preValidation: [fastify.csrfProtection],
    schema: AttemptExerciseSchema,
  }, async (request, reply) => {
    try {
      const user = request.user as any;
      if (!user || !user.studentId) {
        return reply.status(401).send({
          success: false,
          error: {
            message: 'Authentification requise',
            code: 'AUTH_REQUIRED',
          },
        });
      }

      const body = request.body as {
        exerciseId: number;
        competenceCode: string;
        score: number;
        completed: boolean;
        timeSpent: number;
        difficultyLevel?: number;
        hintsUsed?: number;
        confidence?: number;
        attempts?: number;
        answers?: any;
      };

      const { exerciseId, competenceCode, score, completed, timeSpent, difficultyLevel, hintsUsed, confidence, attempts } = body;

      // Get exercise to determine difficulty if not provided
      let finalDifficultyLevel = difficultyLevel;
      if (finalDifficultyLevel === undefined) {
        const [exercise] = await fastify.db
          .select()
          .from(exercises)
          .where(eq(exercises.id, exerciseId))
          .limit(1);

        if (exercise) {
          // Map difficulte string to number (0-5)
          const difficultyMap: Record<string, number> = {
            'FACILE': 1,
            'MOYEN': 3,
            'DIFFICILE': 5
          };
          finalDifficultyLevel = difficultyMap[exercise.difficulte] || 3;
        } else {
          finalDifficultyLevel = 3; // Default medium difficulty
        }
      }

      // Record progress with SuperMemo-2 integration
      const result = await databaseService.recordStudentProgress(user.studentId, {
        exerciseId,
        competenceCode,
        score,
        completed,
        timeSpent,
        difficultyLevel: finalDifficultyLevel,
        hintsUsed: hintsUsed || 0,
        confidence,
        attempts: attempts || 1
      });

      return reply.send({
        success: true,
        message: 'Tentative enregistrée avec succès',
        data: {
          ...result,
          nextReviewDate: result.superMemoUpdated ? 'Calculé par SuperMemo-2' : undefined
        }
      });
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Create attempt error');
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Erreur lors de l\'enregistrement de la tentative',
          code: 'CREATE_ATTEMPT_ERROR',
        },
      });
    }
  });

  // Get student exercise history
  fastify.get('/student-history/:id', {
    preHandler: [fastify.authenticate],
    schema: StudentHistorySchema,
  }, async (_request: FastifyRequest, _reply: FastifyReply) => {
    // ...
  });

  // Get student progress
  fastify.get('/student-progress/:id', {
    preHandler: [fastify.authenticate],
    schema: { params: CommonIdParams },
  }, async (_request: FastifyRequest, _reply: FastifyReply) => {
    // ...
  });

  // Get exercise by ID
  fastify.get('/:id', {
    schema: { params: CommonIdParams }
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      const exercise = await fastify.db
        .select()
        .from(exercises)
        .where(eq(exercises.id, parseInt(id, 10)))
        .limit(1);

      if (exercise.length === 0) {
        return reply.status(404).send({
          success: false,
          error: {
            message: 'Exercice non trouvé',
            code: 'EXERCISE_NOT_FOUND',
          },
        });
      }

      return reply.send({
        success: true,
        data: {
          items: exercise,
          total: exercise.length
        },
        message: 'Exercice récupéré avec succès',
      });
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Get exercise by ID error');
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Erreur lors de la récupération de l\'exercice',
          code: 'GET_EXERCISE_ERROR',
        },
      });
    }
  });

  // Get exercises by level
  fastify.get('/by-level/:level', {
    schema: GetExercisesByLevelSchema
  }, async (_request: FastifyRequest, _reply: FastifyReply) => {
    // ...
  });

  // Get random exercises
  fastify.get('/random/:level', {
    schema: GetRandomExercisesSchema
  }, async (request: FastifyRequest<{ 
    Params: { level: string };
    Querystring: { count?: number; exclude_types?: string[] };
  }>, reply: FastifyReply) => {
    try {
      const { level } = request.params;
      const { count = 5, exclude_types = [] } = request.query as { count?: number; exclude_types?: string[] };

      const whereConditions = [eq(exercises.niveau, level), eq(exercises.estActif, true)];

      // Exclude specific exercise types if provided
      if (exclude_types && exclude_types.length > 0) {
        // Use NOT IN with SQL template for type exclusion
        whereConditions.push(
          sql`${exercises.typeExercice} NOT IN (${sql.join(exclude_types.map(type => sql`${type}`), sql`, `)})`
        );
      }

      // Get random exercises using ORDER BY RAND() and LIMIT
      const randomExercises = await fastify.db
        .select()
        .from(exercises)
        .where(and(...whereConditions))
        .orderBy(sql`RAND()`)
        .limit(count);

      return reply.send({
        success: true,
        data: {
          exercises: randomExercises,
          count: randomExercises.length,
          level
        },
        message: `${randomExercises.length} exercice(s) aléatoire(s) récupéré(s)`
      });
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Get random exercises error');
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Erreur lors de la récupération des exercices aléatoires',
          code: 'GET_RANDOM_EXERCISES_ERROR',
        },
      });
    }
  });

  // Get random exercises (without level filter)
  fastify.get('/random', {
    schema: {
      querystring: Type.Object({
        count: Type.Optional(Type.Integer({ minimum: 1, maximum: 10, default: 5 })),
        niveau: Type.Optional(Type.String()),
        matiere: Type.Optional(Type.String()),
        exclude_types: Type.Optional(Type.Array(Type.String())),
      }),
    },
  }, async (request: FastifyRequest<{ 
    Querystring: { count?: number; niveau?: string; matiere?: string; exclude_types?: string[] };
  }>, reply: FastifyReply) => {
    try {
      const { count = 5, niveau, matiere, exclude_types = [] } = request.query as { 
        count?: number; 
        niveau?: string; 
        matiere?: string; 
        exclude_types?: string[] 
      };

      const whereConditions = [eq(exercises.estActif, true)];

      if (niveau) {
        whereConditions.push(eq(exercises.niveau, niveau));
      }

      if (matiere) {
        whereConditions.push(eq(exercises.matiere, matiere));
      }

      if (exclude_types && exclude_types.length > 0) {
        // Use NOT IN with SQL template for type exclusion
        whereConditions.push(
          sql`${exercises.typeExercice} NOT IN (${sql.join(exclude_types.map(type => sql`${type}`), sql`, `)})`
        );
      }

      const randomExercises = await fastify.db
        .select()
        .from(exercises)
        .where(and(...whereConditions))
        .orderBy(sql`RAND()`)
        .limit(count);

      return reply.send({
        success: true,
        data: {
          exercises: randomExercises,
          count: randomExercises.length
        },
        message: `${randomExercises.length} exercice(s) aléatoire(s) récupéré(s)`
      });
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Get random exercises error');
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Erreur lors de la récupération des exercices aléatoires',
          code: 'GET_RANDOM_EXERCISES_ERROR',
        },
      });
    }
  });

  // Get exercise statistics by level
  fastify.get('/stats/:level', {
    schema: GetExerciseStatsSchema
  }, async (request: FastifyRequest<{ Params: { level: string } }>, reply: FastifyReply) => {
    try {
      const { level } = request.params;

      // Get statistics for exercises at this level
      const [levelStats] = await fastify.db
        .select({
          total: count(exercises.id),
          byMatiere: sql<number>`COUNT(DISTINCT ${exercises.matiere})`,
          byType: sql<number>`COUNT(DISTINCT ${exercises.typeExercice})`,
          byDifficulte: sql<number>`COUNT(DISTINCT ${exercises.difficulte})`,
          active: sql<number>`SUM(CASE WHEN ${exercises.estActif} = true THEN 1 ELSE 0 END)`,
        })
        .from(exercises)
        .where(eq(exercises.niveau, level));

      // Get breakdown by matiere
      const matiereBreakdown = await fastify.db
        .select({
          matiere: exercises.matiere,
          count: count(exercises.id),
        })
        .from(exercises)
        .where(eq(exercises.niveau, level))
        .groupBy(exercises.matiere);

      // Get breakdown by type
      const typeBreakdown = await fastify.db
        .select({
          typeExercice: exercises.typeExercice,
          count: count(exercises.id),
        })
        .from(exercises)
        .where(eq(exercises.niveau, level))
        .groupBy(exercises.typeExercice);

      // Get breakdown by difficulte
      const difficulteBreakdown = await fastify.db
        .select({
          difficulte: exercises.difficulte,
          count: count(exercises.id),
        })
        .from(exercises)
        .where(eq(exercises.niveau, level))
        .groupBy(exercises.difficulte);

      return reply.send({
        success: true,
        data: {
          level,
          total: Number(levelStats?.total || 0),
          active: Number(levelStats?.active || 0),
          inactive: Number(levelStats?.total || 0) - Number(levelStats?.active || 0),
          uniqueMatieres: Number(levelStats?.byMatiere || 0),
          uniqueTypes: Number(levelStats?.byType || 0),
          uniqueDifficultes: Number(levelStats?.byDifficulte || 0),
          breakdown: {
            byMatiere: matiereBreakdown.map(m => ({
              matiere: m.matiere,
              count: Number(m.count)
            })),
            byType: typeBreakdown.map(t => ({
              typeExercice: t.typeExercice,
              count: Number(t.count)
            })),
            byDifficulte: difficulteBreakdown.map(d => ({
              difficulte: d.difficulte,
              count: Number(d.count)
            }))
          }
        },
        message: `Statistiques pour le niveau ${level} récupérées avec succès`
      });
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Get exercise stats error');
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Erreur lors de la récupération des statistiques',
          code: 'GET_EXERCISE_STATS_ERROR',
        },
      });
    }
  });

  // Get exercise statistics by ID
  fastify.get('/:id/stats', {
    schema: { params: CommonIdParams }
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const exerciseId = parseInt(id, 10);

      // Get exercise
      const [exercise] = await fastify.db
        .select()
        .from(exercises)
        .where(eq(exercises.id, exerciseId))
        .limit(1);

      if (!exercise) {
        return reply.status(404).send({
          success: false,
          error: {
            message: 'Exercice non trouvé',
            code: 'EXERCISE_NOT_FOUND',
          },
        });
      }

      // Get statistics from student_progress
      const [progressStats] = await fastify.db
        .select({
          totalAttempts: count(studentProgress.id),
          successfulAttempts: sum(sql<number>`CASE WHEN ${studentProgress.completed} = true THEN 1 ELSE 0 END`),
          averageScore: avg(studentProgress.averageScore),
          bestScore: sql<number>`MAX(${studentProgress.bestScore})`,
          totalTimeSpent: sum(studentProgress.totalTimeSpent),
          masteredCount: sum(sql<number>`CASE WHEN ${studentProgress.masteryLevel} = 'maitrise' THEN 1 ELSE 0 END`),
        })
        .from(studentProgress)
        .where(eq(studentProgress.exerciseId, exerciseId));

      const totalAttempts = Number(progressStats?.totalAttempts || 0);
      const successfulAttempts = Number(progressStats?.successfulAttempts || 0);
      const successRate = totalAttempts > 0 ? (successfulAttempts / totalAttempts) * 100 : 0;

      return reply.send({
        success: true,
        data: {
          exerciseId,
          exercise: {
            titre: exercise.titre,
            niveau: exercise.niveau,
            matiere: exercise.matiere,
            typeExercice: exercise.typeExercice,
            difficulte: exercise.difficulte,
          },
          statistics: {
            totalAttempts,
            successfulAttempts,
            failedAttempts: totalAttempts - successfulAttempts,
            successRate: Math.round(successRate * 100) / 100,
            averageScore: progressStats?.averageScore ? Number(progressStats.averageScore) : 0,
            bestScore: progressStats?.bestScore ? Number(progressStats.bestScore) : 0,
            totalTimeSpent: Number(progressStats?.totalTimeSpent || 0),
            masteredCount: Number(progressStats?.masteredCount || 0),
            masteryRate: totalAttempts > 0 ? (Number(progressStats?.masteredCount || 0) / totalAttempts) * 100 : 0,
          }
        },
        message: 'Statistiques de l\'exercice récupérées avec succès'
      });
    } catch (error: unknown) {
      fastify.log.error({ err: error }, 'Get exercise stats by ID error');
      return reply.status(500).send({
        success: false,
        error: {
          message: 'Erreur lors de la récupération des statistiques de l\'exercice',
          code: 'GET_EXERCISE_STATS_ERROR',
        },
      });
    }
  });
} 