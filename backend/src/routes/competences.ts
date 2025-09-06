import { FastifyInstance } from 'fastify';
import { enhancedDatabaseService as databaseService } from '../services/enhanced-database.service.js';
import { competenciesService } from '../services/competencies.service.js';

export default async function competencesRoutes(fastify: FastifyInstance) {
  // GET /api/competences - List all competencies with optional filtering
  fastify.get('/', async (request, reply) => {
    try {
      const { level, subject, limit = 100, offset = 0 } = request.query as any;
      const filters = { level, subject, limit, offset };
      const cacheKey = competenciesService.generateListCacheKey(filters);
      
      // Try Redis cache first
      let competencies;
      try {
        const cached = await fastify.redis.get(cacheKey);
        if (cached) {
          competencies = JSON.parse(cached);
          return reply.send({ success: true, data: competencies, cached: true });
        }
      } catch (redisError) {
        fastify.log.warn('Redis cache miss or error');
      }

      // Get competencies using service
      competencies = await competenciesService.getCompetenciesList(fastify.db, filters);

      // Cache for 5 minutes
      try {
        await fastify.redis.setex(cacheKey, 300, JSON.stringify(competencies));
      } catch (redisError) {
        fastify.log.warn('Redis cache set error');
      }

      reply.send({ success: true, data: competencies, cached: false });
    } catch (error) {
      fastify.log.error('Error listing competencies');
      reply.status(500).send({
        success: false,
        error: { message: 'Failed to list competencies', code: 'COMPETENCIES_LIST_ERROR' }
      });
    }
  });

  // GET /api/competences/:code - Get specific competency with JSON content
  fastify.get('/:code', async (request, reply) => {
    try {
      const { code } = request.params as { code: string };
      
      // Validate competency code format
      if (!competenciesService.validateCompetencyCode(code)) {
        return reply.status(400).send({
          success: false,
          error: { message: 'Invalid competency code format', code: 'INVALID_CODE_FORMAT' }
        });
      }

      const cacheKey = competenciesService.generateItemCacheKey(code);
      
      // Try Redis cache first
      let competency;
      try {
        const cached = await fastify.redis.get(cacheKey);
        if (cached) {
          competency = JSON.parse(cached);
          return reply.send({ success: true, data: competency, cached: true });
        }
      } catch (redisError) {
        fastify.log.warn('Redis cache miss or error');
      }

      // Get competency using service
      competency = await competenciesService.getCompetencyWithContent(fastify.db, code);

      if (!competency) {
        return reply.status(404).send({
          success: false,
          error: { message: 'Competency not found', code: 'COMPETENCY_NOT_FOUND' }
        });
      }

      // Cache for 5 minutes
      try {
        await fastify.redis.setex(cacheKey, 300, JSON.stringify(competency));
      } catch (redisError) {
        fastify.log.warn('Redis cache set error');
      }

      reply.send({ success: true, data: competency, cached: false });
    } catch (error) {
      fastify.log.error('Error getting competency');
      reply.status(500).send({
        success: false,
        error: { message: 'Failed to get competency', code: 'COMPETENCY_GET_ERROR' }
      });
    }
  });
  // GET /api/competences/:code/prerequisites - Get prerequisites for a competence
  fastify.get('/:code/prerequisites', {
    schema: {
      params: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          includePrerequisiteDetails: { type: 'boolean', default: true },
          studentId: { type: 'number' },
          depth: { type: 'number', default: 1, minimum: 1, maximum: 5 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { code: competenceCode } = request.params as { code: string };
      const { includePrerequisiteDetails = true, studentId, depth = 1 } = request.query as any;

      // Get direct prerequisites
      const prerequisites = await databaseService.getCompetencePrerequisites(competenceCode, {
        includeDetails: includePrerequisiteDetails,
        depth
      });

      let studentProgressData = null;
      if (studentId) {
        // Get student's progress on prerequisites if studentId provided
        const prerequisiteCodes = prerequisites.map(p => p.prerequisiteCode);
        studentProgressData = await databaseService.getStudentCompetenceProgress(studentId, {
          competenceCodes: prerequisiteCodes
        });
      }

      // Build prerequisite tree with student progress
      const prerequisiteTree = await Promise.all(prerequisites.map(async prereq => {
        const studentProgress = studentProgressData?.find(
          sp => sp.competenceCode === prereq.prerequisiteCode
        );
        
        return {
          id: prereq.id,
          competenceCode: competenceCode,
          prerequisiteCode: prereq.prerequisiteCode,
          isRequired: true, // Default to required
          weight: 1, // Default weight
          minimumLevel: prereq.minimumLevel,
          
          // Student progress info (if available)
          studentProgress: studentProgress ? {
            masteryLevel: studentProgress.masteryLevel,
            currentScore: parseFloat(studentProgress.currentScore.toString()),
            totalAttempts: studentProgress.totalAttempts,
            successfulAttempts: studentProgress.successfulAttempts,
            lastAttemptAt: studentProgress.lastAttemptAt
          } : null
        };
      }));

      // Calculate overall readiness
      const readinessAnalysis = {
        totalPrerequisites: prerequisites.length,
        requiredPrerequisites: prerequisites.length, // All are required by default
        
        // Student readiness (if student data available)
        studentReadiness: studentProgressData ? {
          requiredMet: prerequisites
            // All prerequisites treated as required
            .every(p => {
              const progress = studentProgressData.find(sp => sp.competenceCode === p.prerequisiteCode);
              return progress && progress.masteryLevel !== 'decouverte';
            }),
          readinessScore: calculateReadinessScore(prerequisites, studentProgressData),
          blockers: prerequisites
            // All prerequisites treated as required
            .filter(p => {
              const progress = studentProgressData.find(sp => sp.competenceCode === p.prerequisiteCode);
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

    } catch (error) {
      (fastify.log as any).error('Error getting competence prerequisites:', error);
      reply.status(500).send({
        success: false,
        error: {
          message: 'Failed to get competence prerequisites',
          code: 'COMPETENCE_PREREQUISITES_ERROR'
        }
      });
    }
  });

  // GET /api/competences/:code/progress - Get competence progress for all students or specific student
  fastify.get('/:code/progress', {
    schema: {
      params: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          studentId: { type: 'number' },
          limit: { type: 'number', default: 50 },
          offset: { type: 'number', default: 0 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { code: competenceCode } = request.params as { code: string };
      const { studentId } = request.query as any;

      if (studentId) {
        // Get specific student's progress
        const progress = await databaseService.getStudentCompetenceProgress(studentId, {
          competenceCodes: [competenceCode]
        });

        const studentProgress = progress.find(p => p.competenceCode === competenceCode);

        if (!studentProgress) {
          reply.status(404).send({
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
              masteryLevel: studentProgress.masteryLevel,
              currentScore: parseFloat(studentProgress.currentScore.toString()),
              totalAttempts: studentProgress.totalAttempts,
              successfulAttempts: studentProgress.successfulAttempts,
              lastAttemptAt: studentProgress.lastAttemptAt,
              createdAt: studentProgress.createdAt,
              updatedAt: studentProgress.updatedAt
            }
          }
        });
      } else {
        // Get all students' progress for this competence
        // This would require a different query - simplified for now
        reply.send({
          success: true,
          data: {
            competenceCode,
            message: 'Bulk progress endpoint not implemented yet'
          }
        });
      }

    } catch (error) {
      (fastify.log as any).error('Error getting competence progress:', error);
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
