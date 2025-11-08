"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authSchemas = exports.passwordResetConfirmSchema = exports.passwordResetSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
// Zod schemas for validation - SINGLE SOURCE OF TRUTH
const passwordSchema = zod_1.z.string().min(12, 'Le mot de passe doit contenir au moins 12 caractères').max(100);
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Format d\'email invalide').optional(),
    prenom: zod_1.z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').max(50).optional(),
    nom: zod_1.z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(50).optional(),
    password: passwordSchema,
}).refine(data => data.email || (data.prenom && data.nom), {
    message: 'Email ou la combinaison Prénom/Nom est requise.',
    path: ['email'],
});
exports.registerSchema = zod_1.z.object({
    prenom: zod_1.z.string().min(2).max(50),
    nom: zod_1.z.string().min(2).max(50),
    email: zod_1.z.string().email(),
    password: passwordSchema,
    dateNaissance: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Date de naissance invalide' }),
    niveauActuel: zod_1.z.string(),
});
exports.passwordResetSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
exports.passwordResetConfirmSchema = zod_1.z.object({
    token: zod_1.z.string(),
    newPassword: passwordSchema,
});
// Fastify JSON schemas for OpenAPI documentation (aligned with Zod)
exports.authSchemas = {
    login: {
        description: 'Authenticate student and create session',
        summary: 'Student Login',
        tags: ['Authentication'],
        operationId: 'loginStudent',
        body: {
            type: 'object',
            required: ['password'],
            properties: {
                email: { type: 'string', format: 'email', description: 'Student email address', example: 'test@example.com' },
                prenom: { type: 'string', minLength: 2, maxLength: 50, description: 'Student first name', example: 'Alice' },
                nom: { type: 'string', minLength: 2, maxLength: 50, description: 'Student last name', example: 'Dupont' },
                password: { type: 'string', minLength: 12, maxLength: 100, description: 'User password (min 12 characters)', example: 'a-very-secure-password' },
            },
            additionalProperties: false,
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                        type: 'object',
                        properties: {
                            token: { type: 'string', description: 'JWT authentication token' },
                            student: { type: 'object' /* Omitted for brevity */ },
                        },
                    },
                },
            },
            401: { type: 'object', properties: { error: { type: 'string' } } },
            429: { type: 'object', properties: { error: { type: 'string' } } },
        },
    },
    register: {
        description: 'Register a new student account',
        summary: 'Student Registration',
        tags: ['Authentication'],
        operationId: 'registerStudent',
        body: {
            type: 'object',
            required: ['prenom', 'nom', 'email', 'password', 'dateNaissance', 'niveauActuel'],
            properties: {
                prenom: { type: 'string', example: 'Bob' },
                nom: { type: 'string', example: 'Marley' },
                email: { type: 'string', format: 'email', example: 'bob@example.com' },
                password: { type: 'string', minLength: 12, example: 'a-very-secure-password' },
                dateNaissance: { type: 'string', format: 'date', example: '2016-01-20' },
                niveauActuel: { type: 'string', example: 'CP' },
            }
        },
        response: {
            201: { type: 'object', properties: { success: { type: 'boolean' } } },
            400: { type: 'object', properties: { error: { type: 'string' } } }
        }
    },
    logout: {
        description: 'Logout student and invalidate session',
        summary: 'Student Logout',
        tags: ['Authentication'],
        operationId: 'logoutStudent',
        security: [{ bearerAuth: [] }],
        response: {
            200: { type: 'object', properties: { success: { type: 'boolean' } } },
            401: { type: 'object', properties: { error: { type: 'string' } } }
        }
    },
    refresh: {
        description: 'Refresh JWT access token using a refresh token cookie',
        summary: 'Refresh Token',
        tags: ['Authentication'],
        operationId: 'refreshToken',
        response: {
            200: { type: 'object', properties: { success: { type: 'boolean' } } },
            401: { type: 'object', properties: { error: { type: 'string' } } }
        }
    },
    passwordReset: {
        description: 'Request a password reset email',
        summary: 'Request Password Reset',
        tags: ['Authentication'],
        operationId: 'requestPasswordReset',
        body: {
            type: 'object',
            required: ['email'],
            properties: {
                email: { type: 'string', format: 'email' },
            }
        },
        response: {
            200: { type: 'object', properties: { success: { type: 'boolean' } } }
        }
    },
    passwordResetConfirm: {
        description: 'Confirm a password reset with a token',
        summary: 'Confirm Password Reset',
        tags: ['Authentication'],
        operationId: 'confirmPasswordReset',
        body: {
            type: 'object',
            required: ['token', 'newPassword'],
            properties: {
                token: { type: 'string' },
                newPassword: { type: 'string', minLength: 12 },
            }
        },
        response: {
            200: { type: 'object', properties: { success: { type: 'boolean' } } },
            400: { type: 'object', properties: { error: { type: 'string' } } }
        }
    },
    health: {
        description: 'Authentication service health check',
        summary: 'Health Check',
        tags: ['Authentication'],
        operationId: 'checkAuthHealth',
        response: {
            200: { type: 'object', properties: { status: { type: 'string' } } }
        }
    },
};
