import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { exercises } from '../db/schema';
import { CommonIdParams } from '../schemas/common.schema.js';
import { databaseService } from '../services/enhanced-database.service.js';
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
  }, async (_request: FastifyRequest, _reply: FastifyReply) => {
    // ...
  });

  // Get exercise statistics
  fastify.get('/stats/:level', {
    schema: GetExerciseStatsSchema
  }, async (_request: FastifyRequest, _reply: FastifyReply) => {
    // ...
  });
} 