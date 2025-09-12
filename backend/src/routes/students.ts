
import { FastifyInstance } from 'fastify';
import { enhancedDatabaseService as databaseService } from '../services/enhanced-database.service.js';
import { realTimeProgressService } from '../services/real-time-progress.service.js';
import { db } from '../db/connection';
import { students } from '../db/schema';
import crypto from 'crypto';

// Mock authentication middleware for testing
const mockAuthenticate = async (request: any, reply: any) => {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      success: false,
      error: {
        message: 'Token manquant',
        code: 'MISSING_TOKEN'
      }
    });
  }
  
  const token = authHeader.substring(7);
  if (process.env.NODE_ENV === 'test') {
    if (token.startsWith('mock-jwt-token-') || token.startsWith('refreshed-token-')) {
      request.user = { studentId: 1 }; // Mock user
      return;
    }
  }
  
  return reply.status(401).send({
    success: false,
    error: {
      message: 'Token invalide',
      code: 'INVALID_TOKEN'
    }
  });
};

export default async function studentRoutes(fastify: FastifyInstance) {
  // Authorization helper function
  const hasAccess = (user: any, requestedId: number) => {
    if (!user) return false;
    return user.role === 'admin' || user.studentId === requestedId;
  };

  // Individual student data endpoint
  fastify.get('/:id', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const studentId = parseInt(id);

    if (isNaN(studentId)) {
      return reply.status(400).send({ success: false, error: { message: 'ID étudiant invalide', code: 'INVALID_STUDENT_ID' } });
    }

    if (!hasAccess(request.user, studentId)) {
      return reply.status(403).send({ success: false, error: { message: 'Accès refusé', code: 'ACCESS_DENIED' } });
    }

    try {
      const student = await databaseService.getStudentById(studentId);
      if (!student) {
        return reply.status(404).send({ success: false, error: { code: 'STUDENT_NOT_FOUND', message: 'Student not found' } });
      }
      return reply.send({
        success: true,
        data: {
          id: student.id,
          prenom: student.prenom,
          nom: student.nom,
          niveauActuel: student.niveauActuel,
          totalPoints: student.totalPoints,
          serieJours: student.serieJours
        }
      });
    } catch (error) {
      (fastify.log as any).error('Get student error:', error);
      return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get student data' } });
    }
  });

  // Student recommendations endpoint
  fastify.get('/:id/recommendations', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
      return reply.status(400).send({ success: false, error: { message: 'ID étudiant invalide', code: 'INVALID_STUDENT_ID' } });
    }
    if (!hasAccess(request.user, studentId)) {
      return reply.status(403).send({ success: false, error: { message: 'Accès refusé', code: 'ACCESS_DENIED' } });
    }
    const { limit } = request.query as { limit?: string };
    const exerciseLimit = limit ? parseInt(limit) : 5;
    if (limit && isNaN(exerciseLimit)) {
      return reply.status(400).send({ success: false, error: { message: 'Paramètre limit invalide', code: 'INVALID_LIMIT' } });
    }
    try {
      const recommendations = await databaseService.getRecommendedExercises(studentId, exerciseLimit);
      return reply.send({ success: true, data: recommendations });
    } catch (error) {
      (fastify.log as any).error('Get recommendations error:', error);
      return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get recommendations' } });
    }
  });

  // Student exercise attempts endpoint
  fastify.post('/:id/attempts', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
      return reply.status(400).send({ success: false, error: { message: 'ID étudiant invalide', code: 'INVALID_STUDENT_ID' } });
    }
    if (!hasAccess(request.user, studentId)) {
      return reply.status(403).send({ success: false, error: { message: 'Accès refusé', code: 'ACCESS_DENIED' } });
    }
    const attemptData = request.body as any;
    if (!attemptData.exerciseId || !attemptData.attempt) {
      return reply.status(400).send({ success: false, error: { message: 'Données d\'exercice manquantes', code: 'MISSING_EXERCISE_DATA' } });
    }
    const { attempt } = attemptData;
    if (typeof attempt.reussi !== 'boolean' || attempt.tempsSecondes < 0) {
      return reply.status(400).send({ success: false, error: { message: 'Format de tentative invalide', code: 'INVALID_ATTEMPT_FORMAT' } });
    }
    try {
      const result = await databaseService.recordStudentProgress(studentId, attemptData);
      return reply.send({ success: true, data: result });
    } catch (error) {
      (fastify.log as any).error('Submit attempt error:', error);
      return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to submit attempt' } });
    }
  });

  // Student progress endpoint
  fastify.get('/:id/progress', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
      return reply.status(400).send({ success: false, error: { message: 'ID étudiant invalide', code: 'INVALID_STUDENT_ID' } });
    }
    if (!hasAccess(request.user, studentId)) {
      return reply.status(403).send({ success: false, error: { message: 'Accès refusé', code: 'ACCESS_DENIED' } });
    }
    try {
      const progress = await databaseService.getStudentProgress(studentId, undefined, 50);
      return reply.send({ success: true, data: progress });
    } catch (error) {
      (fastify.log as any).error('Get progress error:', error);
      return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get progress' } });
    }
  });

  // Get all students (for login selection) - Now requires authentication
  fastify.get('/', {
    preHandler: fastify.authenticate
  }, async (request, reply) => {
    // Note: This endpoint now requires authentication.
    // A future improvement would be to restrict this to admin roles only.
    if ((request.user as any).role !== 'admin') {
         return reply.status(403).send({ success: false, error: { message: 'Accès administrateur requis', code: 'ADMIN_REQUIRED' } });
    }
    try {
      const allStudents = await db.select().from(students);
      return { success: true, data: allStudents };
    } catch (error) {
      (fastify.log as any).error('Get all students error:', error);
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
    } catch (error) {
      (fastify.log as any).error('Get profile error:', error);
      return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get student profile' } });
    }
  });

  // Update student profile (uses the authenticated user's ID)
  fastify.put('/profile', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          prenom: { type: 'string', minLength: 1 },
          nom: { type: 'string', minLength: 1 },
          age: { type: 'number', minimum: 3, maximum: 18 },
          preferences: { type: 'object' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const studentId = (request.user as any).studentId;
      const updates = request.body as any;
      const updatedStudent = await databaseService.updateStudent(studentId, updates);
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
    } catch (error) {
      (fastify.log as any).error('Update profile error:', error);
      return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update student profile' } });
    }
  });

  // GET /api/students/:id/competence-progress
  fastify.get('/:id/competence-progress', {
    preHandler: fastify.authenticate,
    schema: { /* ... schema ... */ }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
      return reply.status(400).send({ success: false, error: { message: 'ID étudiant invalide', code: 'INVALID_STUDENT_ID' } });
    }
    if (!hasAccess(request.user, studentId)) {
      return reply.status(403).send({ success: false, error: { message: 'Accès refusé', code: 'ACCESS_DENIED' } });
    }
    // ... handler logic
  });

  // POST /api/students/:id/record-progress
  fastify.post('/:id/record-progress', {
    preHandler: fastify.authenticate,
    schema: { /* ... schema ... */ }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
      return reply.status(400).send({ success: false, error: { message: 'ID étudiant invalide', code: 'INVALID_STUDENT_ID' } });
    }
    if (!hasAccess(request.user, studentId)) {
      return reply.status(403).send({ success: false, error: { message: 'Accès refusé', code: 'ACCESS_DENIED' } });
    }
    // ... handler logic
  });

  // GET /api/students/:id/achievements
  fastify.get('/:id/achievements', {
    preHandler: fastify.authenticate,
    schema: { /* ... schema ... */ }
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
      return reply.status(400).send({ success: false, error: { message: 'ID étudiant invalide', code: 'INVALID_STUDENT_ID' } });
    }
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
