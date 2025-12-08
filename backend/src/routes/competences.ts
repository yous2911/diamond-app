import { FastifyInstance } from 'fastify';

import { competenciesService, CompetencyListFilters } from '../services/competencies.service.js';
import { databaseService } from '../services/enhanced-database.service.js';
import {
  GetCompetenciesSchema,
  GetCompetenceSchema,
  GetPrerequisitesSchema,
  GetProgressSchema,
} from '../schemas/competence.schema.js';

export default async function competencesRoutes(fastify: FastifyInstance) {
  // GET /api/competences - List all competencies with optional filtering
  fastify.get('/', { schema: GetCompetenciesSchema }, async (request, reply) => {
    try {
      const filters = request.query as CompetencyListFilters;
      const cacheKey = competenciesService.generateListCacheKey(filters);

      let competencies;
      try {
        const cached = await fastify.redis.get(cacheKey);
        if (cached) {
          competencies = JSON.parse(cached);
          return reply.send({ success: true, data: competencies, cached: true });
        }
      } catch (redisError: unknown) {
        fastify.log.warn('Redis cache miss or error');
      }

      competencies = await competenciesService.getCompetenciesList(fastify.db, filters || {});

      try {
        await fastify.redis.setex(cacheKey, 300, JSON.stringify(competencies));
      } catch (redisError: unknown) {
        fastify.log.warn('Redis cache set error');
      }

      reply.send({ success: true, data: competencies, cached: false });
    } catch (error: unknown) {
      const _errorMessage = error instanceof Error ? error.message : 'Unknown error';
      fastify.log.error({ err: error }, 'Error listing competencies');
      reply.status(500).send({
        success: false,
        error: { message: 'Failed to list competencies', code: 'COMPETENCIES_LIST_ERROR' }
      });
    }
  });

  // GET /api/competences/:code - Get specific competency with JSON content
  fastify.get<{ Params: { code: string } }>('/:code', { schema: GetCompetenceSchema }, async (request, reply) => {
    try {
      const { code } = request.params;
      const cacheKey = competenciesService.generateItemCacheKey(code);

      let competency;
      try {
        const cached = await fastify.redis.get(cacheKey);
        if (cached) {
          competency = JSON.parse(cached);
          return reply.send({ success: true, data: competency, cached: true });
        }
      } catch (redisError: unknown) {
        fastify.log.warn('Redis cache miss or error');
      }

      competency = await competenciesService.getCompetencyWithContent(fastify.db, code);

      if (!competency) {
        return reply.status(404).send({
          success: false,
          error: { message: 'Competency not found', code: 'COMPETENCY_NOT_FOUND' }
        });
      }

      try {
        await fastify.redis.setex(cacheKey, 300, JSON.stringify(competency));
      } catch (redisError: unknown) {
        fastify.log.warn('Redis cache set error');
      }

      reply.send({ success: true, data: competency, cached: false });
    } catch (error: unknown) {
      const _errorMessage = error instanceof Error ? error.message : 'Unknown error';
      fastify.log.error({ err: error }, 'Error getting competency');
      reply.status(500).send({
        success: false,
        error: { message: 'Failed to get competency', code: 'COMPETENCY_GET_ERROR' }
      });
    }
  });

  // GET /api/competences/:code/prerequisites - Get prerequisites for a competence
  fastify.get<{
    Params: { code: string };
    Querystring: { includePrerequisiteDetails?: boolean; studentId?: number; depth?: number };
  }>('/:code/prerequisites', { schema: GetPrerequisitesSchema }, async (request, reply) => {
    try {
      const { code: competenceCode } = request.params;
      const { includePrerequisiteDetails, studentId, depth } = request.query;

      const prerequisites = await databaseService.getCompetencePrerequisites(competenceCode, {
        includeDetails: includePrerequisiteDetails,
        depth
      });

      let studentProgressData: Awaited<ReturnType<typeof databaseService.getStudentCompetenceProgress>> | null = null;
      if (studentId) {
        const prerequisiteCodes = prerequisites.map(p => p.prerequisiteCode);
        studentProgressData = await databaseService.getStudentCompetenceProgress(studentId, {
          competenceCodes: prerequisiteCodes
        });
      }

      const prerequisiteTree = await Promise.all(prerequisites.map(async prereq => {
        const studentProgress = studentProgressData?.find(
          sp => sp.competenceCode === prereq.prerequisiteCode
        );
        
        return {
          id: prereq.id ?? 0,
          competenceCode: competenceCode,
          prerequisiteCode: prereq.prerequisiteCode ?? '',
          isRequired: true,
          weight: 1,
          minimumLevel: prereq.minimumLevel ?? 0,
          studentProgress: studentProgress ? {
            masteryLevel: studentProgress.masteryLevel ?? 'decouverte',
            currentScore: parseFloat((studentProgress.currentScore ?? 0).toString()),
            totalAttempts: studentProgress.totalAttempts ?? 0,
            successfulAttempts: studentProgress.successfulAttempts ?? 0,
            lastAttemptAt: studentProgress.lastAttemptAt ?? null
          } : null
        };
      }));

      const readinessAnalysis = {
        totalPrerequisites: prerequisites.length,
        requiredPrerequisites: prerequisites.length,
        studentReadiness: studentProgressData ? {
          requiredMet: prerequisites.every(p => {
              const progress = studentProgressData?.find(sp => sp.competenceCode === p.prerequisiteCode);
              return progress && progress.masteryLevel !== 'decouverte';
            }),
          readinessScore: calculateReadinessScore(prerequisites, studentProgressData || []),
          blockers: prerequisites
            .filter(p => {
              const progress = studentProgressData?.find(sp => sp.competenceCode === p.prerequisiteCode);
              return !progress || progress.masteryLevel === 'decouverte';
            })
            .map(p => p.prerequisiteCode)
        } : null
      };

      reply.send({
        success: true,
        data: {
          competenceCode,
          prerequisites: prerequisiteTree,
          analysis: readinessAnalysis,
          metadata: {
            depth,
            includeDetails: includePrerequisiteDetails,
            studentAnalyzed: !!studentId
          }
        }
      });

    } catch (error: unknown) {
      const _errorMessage = error instanceof Error ? error.message : 'Unknown error';
      fastify.log.error({ err: error }, 'Error getting competence prerequisites:');
      reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to get competence prerequisites',
          code: 'COMPETENCE_PREREQUISITES_ERROR'
        }
      });
    }
  });

  // GET /api/competences/:code/progress - Get competence progress
  fastify.get<{
    Params: { code: string };
    Querystring: { studentId?: number };
  }>('/:code/progress', { schema: GetProgressSchema }, async (request, reply) => {
    try {
      const { code: competenceCode } = request.params;
      const { studentId } = request.query;

      if (studentId) {
        const progress = await databaseService.getStudentCompetenceProgress(studentId, {
          competenceCodes: [competenceCode]
        });

        const studentProgress = progress.find(p => p.competenceCode === competenceCode);

        if (!studentProgress) {
          return reply.status(404).send({
            success: false,
            error: {
              message: 'No progress found for this competence',
              code: 'PROGRESS_NOT_FOUND'
            }
          });
        }

        reply.send({
          success: true,
          data: {
            competenceCode,
            studentId,
            progress: {
              masteryLevel: studentProgress.masteryLevel ?? 'decouverte',
              currentScore: parseFloat((studentProgress.currentScore ?? 0).toString()),
              totalAttempts: studentProgress.totalAttempts ?? 0,
              successfulAttempts: studentProgress.successfulAttempts ?? 0,
              lastAttemptAt: studentProgress.lastAttemptAt ?? null,
              createdAt: studentProgress.createdAt ?? new Date(),
              updatedAt: studentProgress.updatedAt ?? new Date()
            }
          }
        });
      } else {
        reply.send({
          success: true,
          data: {
            competenceCode,
            message: 'Bulk progress endpoint not implemented yet'
          }
        });
      }

    } catch (error: unknown) {
      const _errorMessage = error instanceof Error ? error.message : 'Unknown error';
      fastify.log.error({ err: error }, 'Error getting competence progress:');
      reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to get competence progress',
          code: 'COMPETENCE_PROGRESS_ERROR'
        }
      });
    }
  });
}

// Helper function to calculate readiness score
function calculateReadinessScore(prerequisites: any[], studentProgress: any[]): number {
  if (!studentProgress || studentProgress.length === 0) {
    return 0;
  }

  let totalWeight = 0;
  let achievedWeight = 0;

  prerequisites.forEach(prereq => {
    const weight = parseFloat((prereq.weight || 1).toString());
    totalWeight += weight;

    const progress = studentProgress.find(p => p.competenceCode === prereq.prerequisiteCode);
    if (progress && progress.masteryLevel !== 'decouverte') {
      // Give partial credit based on mastery level
      const masteryMultiplier = {
        'decouverte': 0,
        'apprentissage': 0.4,
        'maitrise': 0.8,
        'expertise': 1.0
      }[progress.masteryLevel] || 0;

      achievedWeight += weight * masteryMultiplier;
    }
  });

  return totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;
}