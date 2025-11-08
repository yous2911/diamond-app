
import { FastifyInstance } from 'fastify';
import { Static } from '@sinclair/typebox';
import { enhancedDatabaseService as databaseService } from '../services/enhanced-database.service.js';
import { getStudentWithProgress, getRecommendedExercises } from '../db/optimized-queries';
import { db } from '../db/connection';
import { students } from '../db/schema';
import { CommonIdParams } from '../schemas/common.schema.js';
import {
  UpdateProfileSchema,
  RecommendationsSchema,
  AttemptSchema,
  ProgressSchema,
  CompetenceProgressSchema,
  RecordProgressSchema,
  AchievementsSchema
} from '../schemas/student.schema.js';

export default async function studentRoutes(fastify: FastifyInstance) {
  // Authorization helper function
  const hasAccess = (user: any, requestedId: number) => {
    if (!user) return false;
    return user.role === 'admin' || user.studentId === requestedId;
  };

  // Individual student data endpoint
  fastify.get('/:id', {
    preHandler: fastify.authenticate,
    schema: { params: CommonIdParams }
  }, async (request, reply) => {
    const { id: studentId } = request.params as Static<typeof CommonIdParams>;

    if (!hasAccess(request.user, studentId)) {
      return reply.status(403).send({ success: false, error: { message: 'Accès refusé', code: 'ACCESS_DENIED' } });
    }

    try {
      const studentData = await getStudentWithProgress(studentId);
      if (!studentData) {
        return reply.status(404).send({ success: false, error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' } });
      }
      return reply.send({
        success: true,
        data: studentData
      });
    } catch (error: unknown) {
      fastify.log.error(error as Error, 'Get student error');
      return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get student data' } });
    }
  });

  // Student recommendations endpoint
  fastify.get('/:id/recommendations', {
    preHandler: fastify.authenticate,
    schema: RecommendationsSchema
  }, async (request, reply) => {
    const { id: studentId } = request.params as Static<typeof RecommendationsSchema.params>;
    const { limit } = request.query as Static<typeof RecommendationsSchema.querystring>;

    if (!hasAccess(request.user, studentId)) {
      return reply.status(403).send({ success: false, error: { message: 'Accès refusé', code: 'ACCESS_DENIED' } });
    }

    try {
      const recommendations = await getRecommendedExercises(studentId, limit);
      return reply.send({ success: true, data: recommendations });
    } catch (error: unknown) {
      fastify.log.error(error as Error, 'Get recommendations error');
      return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get recommendations' } });
    }
  });

  // Student exercise attempts endpoint
  fastify.post('/:id/attempts', {
    preHandler: fastify.authenticate,
    preValidation: fastify.csrfProtection,
    schema: AttemptSchema
  }, async (request, reply) => {
    const { id: studentId } = request.params as Static<typeof AttemptSchema.params>;
    const attemptData = request.body as Static<typeof AttemptSchema.body>;

    if (!hasAccess(request.user, studentId)) {
      return reply.status(403).send({ success: false, error: { message: 'Accès refusé', code: 'ACCESS_DENIED' } });
    }

    try {
      const result = await databaseService.recordStudentProgress(studentId, attemptData as any);
      return reply.send({ success: true, data: result });
    } catch (error: unknown) {
      fastify.log.error(error as Error, 'Submit attempt error');
      return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to submit attempt' } });
    }
  });

  // Student progress endpoint
  fastify.get('/:id/progress', {
    preHandler: fastify.authenticate,
    schema: ProgressSchema
  }, async (request, reply) => {
    const { id: studentId } = request.params as Static<typeof ProgressSchema.params>;

    if (!hasAccess(request.user, studentId)) {
      return reply.status(403).send({ success: false, error: { message: 'Accès refusé', code: 'ACCESS_DENIED' } });
    }

    try {
      const progress = await databaseService.getStudentProgress(studentId, undefined, 50);
      return reply.send({ success: true, data: progress });
    } catch (error: unknown) {
      fastify.log.error(error as Error, 'Get progress error');
      return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get progress' } });
    }
  });

  // Get all students (for login selection) - Now requires authentication
  fastify.get('/', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    if ((request.user as any).role !== 'admin') {
         return reply.status(403).send({ success: false, error: { message: 'Accès administrateur requis', code: 'ADMIN_REQUIRED' } });
    }
    try {
      const allStudents = await db.select().from(students);
      return { success: true, data: allStudents };
    } catch (error: unknown) {
      fastify.log.error(error as Error, 'Get all students error');
      return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get students list' } });
    }
  });

  // Get student profile (uses the authenticated user's ID)
  fastify.get('/profile', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    try {
      const studentId = (request.user as any).studentId;
      const student = await databaseService.getStudentById(studentId);
      if (!student) {
        return reply.status(404).send({ success: false, error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' } });
      }
      return {
        success: true,
        data: {
          student: {
            id: student.id,
            prenom: student.prenom,
            nom: student.nom,
            dateNaissance: student.dateNaissance,
            niveauActuel: student.niveauActuel,
            totalPoints: student.totalPoints,
            serieJours: student.serieJours,
            mascotteType: student.mascotteType,
            dernierAcces: student.dernierAcces,
            estConnecte: student.estConnecte
          }
        }
      };
    } catch (error: unknown) {
      fastify.log.error(error as Error, 'Get profile error');
      return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get student profile' } });
    }
  });

  // Update student profile (uses the authenticated user's ID)
  fastify.put('/profile', {
    preHandler: fastify.authenticate,
    preValidation: fastify.csrfProtection,
    schema: UpdateProfileSchema
  }, async (request, reply) => {
    try {
      const studentId = (request.user as any).studentId;
      const updates = request.body as Static<typeof UpdateProfileSchema.body>;
      const updatedStudent = await databaseService.updateStudent(studentId, updates as any);
      return {
        success: true,
        data: {
          student: {
            id: updatedStudent.id,
            prenom: updatedStudent.prenom,
            nom: updatedStudent.nom,
            dateNaissance: updatedStudent.dateNaissance,
            niveauActuel: updatedStudent.niveauActuel,
            totalPoints: updatedStudent.totalPoints,
            serieJours: updatedStudent.serieJours,
            mascotteType: updatedStudent.mascotteType
          }
        }
      };
    } catch (error: unknown) {
      fastify.log.error(error as Error, 'Update profile error');
      return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update student profile' } });
    }
  });

  // GET /api/students/:id/competence-progress
  fastify.get('/:id/competence-progress', {
    preHandler: fastify.authenticate,
    schema: CompetenceProgressSchema
  }, async (request, reply) => {
    const { id: studentId } = request.params as Static<typeof CompetenceProgressSchema.params>;
    if (!hasAccess(request.user, studentId)) {
      return reply.status(403).send({ success: false, error: { message: 'Accès refusé', code: 'ACCESS_DENIED' } });
    }
    // ... handler logic
  });

  // POST /api/students/:id/record-progress
  fastify.post('/:id/record-progress', {
    preHandler: fastify.authenticate,
    preValidation: fastify.csrfProtection,
    schema: RecordProgressSchema
  }, async (request, reply) => {
    const { id: studentId } = request.params as Static<typeof RecordProgressSchema.params>;
    if (!hasAccess(request.user, studentId)) {
      return reply.status(403).send({ success: false, error: { message: 'Accès refusé', code: 'ACCESS_DENIED' } });
    }
    // ... handler logic
  });

  // GET /api/students/:id/achievements
  fastify.get('/:id/achievements', {
    preHandler: fastify.authenticate,
    schema: AchievementsSchema
  }, async (request, reply) => {
    const { id: studentId } = request.params as Static<typeof AchievementsSchema.params>;
    if (!hasAccess(request.user, studentId)) {
      return reply.status(403).send({ success: false, error: { message: 'Accès refusé', code: 'ACCESS_DENIED' } });
    }
    // ... handler logic
  });

  // Health check for student service
  fastify.get('/health', async (request, reply) => {
    // ... handler logic
  });
}
