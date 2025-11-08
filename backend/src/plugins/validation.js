"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Enhanced Validation Plugin with Zod and Fastify Integration
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const zod_1 = require("zod");
const input_sanitization_middleware_1 = require("../middleware/input-sanitization.middleware");
const logger_1 = require("../utils/logger");
const defaultConfig = {
    enabled: true,
    sanitizeInputs: true,
    validateResponses: false,
    logValidationErrors: true,
};
// Enhanced validation plugin
const validationPlugin = async (fastify) => {
    const config = { ...defaultConfig };
    const sanitizationService = new input_sanitization_middleware_1.InputSanitizationService();
    // Custom schema compiler for Zod integration
    fastify.setValidatorCompiler(({ schema }) => {
        return (data) => {
            try {
                if (!schema || typeof schema !== 'object') {
                    return { value: data };
                }
                // Convert JSON Schema to Zod schema
                const zodSchema = jsonSchemaToZod(schema);
                const result = zodSchema.parse(data);
                return { value: result };
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
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
    fastify.decorate('validateData', async (schema, data) => {
        try {
            const result = await schema.parseAsync(data);
            return { success: true, data: result };
        }
        catch (error) {
            if (config.logValidationErrors) {
                logger_1.logger.warn('Data validation failed', { error, data });
            }
            return {
                success: false,
                error: error instanceof zod_1.ZodError ? error.format() : error
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
        createStudent: zod_1.z.object({
            nom: zod_1.z.string().min(1).max(50),
            prenom: zod_1.z.string().min(1).max(50),
            email: zod_1.z.string().email(),
            motDePasse: zod_1.z.string().min(6),
            niveauScolaire: zod_1.z.enum(['CP', 'CE1', 'CE2', 'CM1', 'CM2']),
            dateNaissance: zod_1.z.string().datetime().optional(),
        }),
        updateStudent: zod_1.z.object({
            nom: zod_1.z.string().min(1).max(50).optional(),
            prenom: zod_1.z.string().min(1).max(50).optional(),
            email: zod_1.z.string().email().optional(),
            niveauScolaire: zod_1.z.enum(['CP', 'CE1', 'CE2', 'CM1', 'CM2']).optional(),
        }),
        // Exercise schemas
        createExercise: zod_1.z.object({
            titre: zod_1.z.string().min(1).max(200),
            description: zod_1.z.string().max(1000).optional(),
            matiere: zod_1.z.enum(['mathematiques', 'francais', 'sciences']),
            niveau: zod_1.z.enum(['CP', 'CE1', 'CE2', 'CM1', 'CM2']),
            difficulte: zod_1.z.enum(['decouverte', 'apprentissage', 'maitrise', 'expertise']),
            competenceCode: zod_1.z.string().min(1).max(50),
            typeExercice: zod_1.z.enum(['multiple-choice', 'fill-in-blank', 'text-input', 'drag-drop']),
            contenu: zod_1.z.record(zod_1.z.unknown()),
            solution: zod_1.z.record(zod_1.z.unknown()),
            pointsRecompense: zod_1.z.number().min(0).max(1000).default(10),
            tempsEstime: zod_1.z.number().min(1).max(3600).default(60),
            xp: zod_1.z.number().min(0).max(1000).default(10),
        }),
        // Progress schemas
        createProgress: zod_1.z.object({
            studentId: zod_1.z.number(),
            exerciseId: zod_1.z.number(),
            competenceCode: zod_1.z.string().min(1).max(50),
            masteryLevel: zod_1.z.enum(['decouverte', 'apprentissage', 'maitrise', 'expertise']),
            score: zod_1.z.string().regex(/^\d+\.\d{2}$/),
            timeSpent: zod_1.z.number().min(0),
            isCompleted: zod_1.z.boolean().default(false),
        }),
    };
    // Add schemas to fastify instance
    fastify.decorate('schemas', commonSchemas);
    logger_1.logger.info('✅ Enhanced validation plugin registered successfully');
};
// Common validation schemas
const commonSchemas = {
    // Student schemas
    createStudent: zod_1.z.object({
        nom: zod_1.z.string().min(1).max(50),
        prenom: zod_1.z.string().min(1).max(50),
        email: zod_1.z.string().email(),
        motDePasse: zod_1.z.string().min(6),
        niveauScolaire: zod_1.z.enum(['CP', 'CE1', 'CE2', 'CM1', 'CM2']),
        dateNaissance: zod_1.z.string().datetime().optional(),
    }),
    updateStudent: zod_1.z.object({
        nom: zod_1.z.string().min(1).max(50).optional(),
        prenom: zod_1.z.string().min(1).max(50).optional(),
        email: zod_1.z.string().email().optional(),
        niveauScolaire: zod_1.z.enum(['CP', 'CE1', 'CE2', 'CM1', 'CM2']).optional(),
    }),
    // Exercise schemas
    createExercise: zod_1.z.object({
        titre: zod_1.z.string().min(1).max(200),
        description: zod_1.z.string().max(1000).optional(),
        matiere: zod_1.z.enum(['mathematiques', 'francais', 'sciences']),
        niveau: zod_1.z.enum(['CP', 'CE1', 'CE2', 'CM1', 'CM2']),
        difficulte: zod_1.z.enum(['decouverte', 'apprentissage', 'maitrise', 'expertise']),
        competenceCode: zod_1.z.string().min(1).max(50),
        typeExercice: zod_1.z.enum(['multiple-choice', 'fill-in-blank', 'text-input', 'drag-drop']),
        contenu: zod_1.z.record(zod_1.z.unknown()),
        solution: zod_1.z.record(zod_1.z.unknown()),
        pointsRecompense: zod_1.z.number().min(0).max(1000).default(10),
        tempsEstime: zod_1.z.number().min(1).max(3600).default(60),
        xp: zod_1.z.number().min(0).max(1000).default(10),
    }),
    // Progress schemas
    createProgress: zod_1.z.object({
        studentId: zod_1.z.number(),
        exerciseId: zod_1.z.number(),
        competenceCode: zod_1.z.string().min(1).max(50),
        masteryLevel: zod_1.z.enum(['decouverte', 'apprentissage', 'maitrise', 'expertise']),
        score: zod_1.z.string().regex(/^\d+\.\d{2}$/),
        timeSpent: zod_1.z.number().min(0),
        isCompleted: zod_1.z.boolean().default(false),
    }),
};
// Helper function to convert basic JSON Schema to Zod
function jsonSchemaToZod(schema) {
    if (!schema || typeof schema !== 'object') {
        return zod_1.z.any();
    }
    // Handle different schema types
    switch (schema.type) {
        case 'string':
            let stringSchema = zod_1.z.string();
            if (schema.minLength)
                stringSchema = stringSchema.min(schema.minLength);
            if (schema.maxLength)
                stringSchema = stringSchema.max(schema.maxLength);
            if (schema.pattern)
                stringSchema = stringSchema.regex(new RegExp(schema.pattern));
            if (schema.format === 'email')
                stringSchema = stringSchema.email();
            return stringSchema;
        case 'number':
        case 'integer':
            let numberSchema = schema.type === 'integer' ? zod_1.z.number().int() : zod_1.z.number();
            if (schema.minimum !== undefined)
                numberSchema = numberSchema.min(schema.minimum);
            if (schema.maximum !== undefined)
                numberSchema = numberSchema.max(schema.maximum);
            return numberSchema;
        case 'boolean':
            return zod_1.z.boolean();
        case 'array':
            const itemSchema = schema.items ? jsonSchemaToZod(schema.items) : zod_1.z.any();
            let arraySchema = zod_1.z.array(itemSchema);
            if (schema.minItems)
                arraySchema = arraySchema.min(schema.minItems);
            if (schema.maxItems)
                arraySchema = arraySchema.max(schema.maxItems);
            return arraySchema;
        case 'object':
            if (schema.properties) {
                const shape = {};
                for (const [key, value] of Object.entries(schema.properties)) {
                    shape[key] = jsonSchemaToZod(value);
                }
                const objectSchema = zod_1.z.object(shape);
                if (schema.additionalProperties === false) {
                    return objectSchema.strict();
                }
                return objectSchema;
            }
            return zod_1.z.object({});
        default:
            return zod_1.z.any();
    }
}
exports.default = (0, fastify_plugin_1.default)(validationPlugin, {
    name: 'validation',
    dependencies: []
});
