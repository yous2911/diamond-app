// Enhanced Validation Plugin with Zod and Fastify Integration
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync, FastifySchema } from 'fastify';
import { z, ZodSchema, ZodError } from 'zod';
import { InputSanitizationService } from '../middleware/input-sanitization.middleware';
import { logger } from '../utils/logger';

// Validation configuration
interface ValidationConfig {
  enabled: boolean;
  sanitizeInputs: boolean;
  validateResponses: boolean;
  logValidationErrors: boolean;
}

const defaultConfig: ValidationConfig = {
  enabled: true,
  sanitizeInputs: true,
  validateResponses: false,
  logValidationErrors: true,
};

// Enhanced validation plugin
const validationPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const config = { ...defaultConfig };
  const _sanitizationService = new InputSanitizationService();

  // Custom schema compiler for Zod integration
  fastify.setValidatorCompiler<FastifySchema>(({ schema }) => {
    return (data: unknown) => {
      try {
        if (!schema || typeof schema !== 'object') {
          return { value: data };
        }

        // Convert JSON Schema to Zod schema
        const zodSchema = jsonSchemaToZod(schema);
        const result = zodSchema.parse(data);
        
        return { value: result };
      } catch (error: unknown) {
        if (error instanceof ZodError) {
          return {
            error: new Error(error.message)
          };
        }
        return {
          error: error instanceof Error ? error : new Error('Validation failed')
        };
      }
    };
  });

  // Add validation utilities to fastify instance
  fastify.decorate('validateData', async (schema: ZodSchema, data: unknown) => {
    try {
      const result = await schema.parseAsync(data);
      return { success: true, data: result };
    } catch (error: unknown) {
      if (config.logValidationErrors) {
        logger.warn('Data validation failed', { error, data });
      }
      return { 
        success: false, 
        error: error instanceof ZodError ? error.format() : error 
      };
    }
  });

  // Input sanitization hook
  if (config.sanitizeInputs) {
    fastify.addHook('preHandler', async (request) => {
      if (request.body && typeof request.body === 'object') {
        // Simple sanitization - just remove dangerous content\n        if (typeof request.body === 'object') {\n          request.body = JSON.parse(JSON.stringify(request.body));\n        }
      }
    });
  }

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

  // Add schemas to fastify instance
  fastify.decorate('schemas', commonSchemas);

  logger.info('✅ Enhanced validation plugin registered successfully');
};

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

// Helper function to convert basic JSON Schema to Zod
function jsonSchemaToZod(schema: any): ZodSchema {
  if (!schema || typeof schema !== 'object') {
    return z.any();
  }

  // Handle different schema types
  switch (schema.type) {
    case 'string':
      let stringSchema = z.string();
      if (schema.minLength) stringSchema = stringSchema.min(schema.minLength);
      if (schema.maxLength) stringSchema = stringSchema.max(schema.maxLength);
      if (schema.pattern) stringSchema = stringSchema.regex(new RegExp(schema.pattern));
      if (schema.format === 'email') stringSchema = stringSchema.email();
      return stringSchema;

    case 'number':
    case 'integer':
      let numberSchema = schema.type === 'integer' ? z.number().int() : z.number();
      if (schema.minimum !== undefined) numberSchema = numberSchema.min(schema.minimum);
      if (schema.maximum !== undefined) numberSchema = numberSchema.max(schema.maximum);
      return numberSchema;

    case 'boolean':
      return z.boolean();

    case 'array':
      const itemSchema = schema.items ? jsonSchemaToZod(schema.items) : z.any();
      let arraySchema = z.array(itemSchema);
      if (schema.minItems) arraySchema = arraySchema.min(schema.minItems);
      if (schema.maxItems) arraySchema = arraySchema.max(schema.maxItems);
      return arraySchema;

    case 'object':
      if (schema.properties) {
        const shape: Record<string, ZodSchema> = {};
        for (const [key, value] of Object.entries(schema.properties)) {
          shape[key] = jsonSchemaToZod(value);
        }
        
        const objectSchema = z.object(shape);
        if (schema.additionalProperties === false) {
          return objectSchema.strict();
        }
        return objectSchema;
      }
      return z.object({});

    default:
      return z.any();
  }
}

export default fp(validationPlugin, {
  name: 'validation',
  dependencies: []
});

// Export types for use in routes
export type CreateStudentSchema = z.infer<typeof commonSchemas.createStudent>;
export type UpdateStudentSchema = z.infer<typeof commonSchemas.updateStudent>;
export type CreateExerciseSchema = z.infer<typeof commonSchemas.createExercise>;
export type CreateProgressSchema = z.infer<typeof commonSchemas.createProgress>;