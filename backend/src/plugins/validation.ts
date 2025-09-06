// Enhanced Validation Plugin with Zod and Fastify Integration
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { z, ZodSchema, ZodError } from 'zod';
import { logger } from '../utils/logger';

// Common validation schemas
const commonSchemas = {
  // Student schemas
  createStudent: z.object({
    nom: z.string().min(1).max(50),
    prenom: z.string().min(1).max(50),
    email: z.string().email(),
    motDePasse: z.string().min(6),
    niveauScolaire: z.enum(['CP', 'CE1', 'CE2', 'CM1', 'CM2']),
    dateNaissance: z.string().datetime().optional(),
  }),

  updateStudent: z.object({
    nom: z.string().min(1).max(50).optional(),
    prenom: z.string().min(1).max(50).optional(),
    email: z.string().email().optional(),
    niveauScolaire: z.enum(['CP', 'CE1', 'CE2', 'CM1', 'CM2']).optional(),
  }),

  // Exercise schemas
  createExercise: z.object({
    titre: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    matiere: z.enum(['mathematiques', 'francais', 'sciences']),
    niveau: z.enum(['CP', 'CE1', 'CE2', 'CM1', 'CM2']),
    difficulte: z.enum(['decouverte', 'apprentissage', 'maitrise', 'expertise']),
    competenceCode: z.string().min(1).max(50),
    typeExercice: z.enum(['multiple-choice', 'fill-in-blank', 'text-input', 'drag-drop']),
    contenu: z.record(z.unknown()),
    solution: z.record(z.unknown()),
    pointsRecompense: z.number().min(0).max(1000).default(10),
    tempsEstime: z.number().min(1).max(3600).default(60),
    xp: z.number().min(0).max(1000).default(10),
  }),

  // Progress schemas
  createProgress: z.object({
    studentId: z.number(),
    exerciseId: z.number(),
    competenceCode: z.string().min(1).max(50),
    masteryLevel: z.enum(['decouverte', 'apprentissage', 'maitrise', 'expertise']),
    score: z.string().regex(/^\d+\.\d{2}$/),
    timeSpent: z.number().min(0),
    isCompleted: z.boolean().default(false),
  }),
};


// Enhanced validation plugin
const validationPlugin = async (fastify: FastifyInstance) => {
  // Add schemas to fastify instance
  fastify.decorate('schemas', commonSchemas);

  // Add validation utilities to fastify instance
  fastify.decorate('validateData', async (schema: ZodSchema, data: unknown) => {
    try {
      const result = await schema.parseAsync(data);
      return { success: true, data: result };
    } catch (error) {
      logger.warn('Data validation failed', { error, data });
      return {
        success: false,
        error: error instanceof ZodError ? error.format() : error
      };
    }
  });

  logger.info('✅ Enhanced validation plugin registered successfully');
};

export default fp(validationPlugin, {
  name: 'validation',
  dependencies: []
});

// Export types for use in routes
export type CreateStudentSchema = z.infer<typeof commonSchemas.createStudent>;
export type UpdateStudentSchema = z.infer<typeof commonSchemas.updateStudent>;
export type CreateExerciseSchema = z.infer<typeof commonSchemas.createExercise>;
export type CreateProgressSchema = z.infer<typeof commonSchemas.createProgress>;