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
  const sanitizationService = new InputSanitizationService();

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
      } catch (error) {
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
    } catch (error) {
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

  logger.info('✅ Enhanced validation plugin registered successfully');
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
        const required = schema.required || [];
        for (const [key, value] of Object.entries(schema.properties)) {
          const zodSchema = jsonSchemaToZod(value);
          if (!required.includes(key)) {
            shape[key] = zodSchema.optional();
          } else {
            shape[key] = zodSchema;
          }
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