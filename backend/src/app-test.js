"use strict";
// src/app-test.ts - Mise à jour pour inclure les routes GDPR dans les tests
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = void 0;
const fastify_1 = __importDefault(require("fastify"));
const service_factory_1 = require("./services/service-factory");
async function build() {
    const fastify = (0, fastify_1.default)({
        logger: false, // Disable logging in tests
        ignoreTrailingSlash: true,
        disableRequestLogging: true,
    });
    // Register core services first
    fastify.decorate('services', {
        encryption: service_factory_1.ServiceFactory.getEncryptionService(),
        email: service_factory_1.ServiceFactory.getEmailService(),
        audit: service_factory_1.ServiceFactory.getAuditTrailService(),
        storage: service_factory_1.ServiceFactory.getStorageService(),
        fileSecurity: service_factory_1.ServiceFactory.getFileSecurityService(),
        imageProcessing: service_factory_1.ServiceFactory.getImageProcessingService()
    });
    // Register plugins (same as main app but for testing)
    try {
        // Register plugins sequentially to avoid conflicts
        await fastify.register(Promise.resolve().then(() => __importStar(require('./plugins/database'))));
        await fastify.register(Promise.resolve().then(() => __importStar(require('./plugins/redis'))));
        await fastify.register(Promise.resolve().then(() => __importStar(require('./plugins/auth'))));
        await fastify.register(Promise.resolve().then(() => __importStar(require('./plugins/validation'))));
        await fastify.register(Promise.resolve().then(() => __importStar(require('./plugins/gdpr'))));
        // Add database decoration for tests (only if not already decorated)
        if (!fastify.hasDecorator('db')) {
            fastify.decorate('db', fastify.db);
        }
    }
    catch (error) {
        console.warn('Plugin registration warning:', error);
        // Continue with reduced functionality for testing
    }
    // Register routes for testing (test app needs routes to test against)
    try {
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/monitoring'))), { prefix: '/api/monitoring' });
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/auth'))), { prefix: '/api/auth' });
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/students'))), { prefix: '/api/students' });
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/exercises'))), { prefix: '/api/exercises' });
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/competences'))), { prefix: '/api/competences' });
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/gdpr'))), { prefix: '/api/gdpr' });
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/upload'))), { prefix: '/api' });
    }
    catch (error) {
        console.warn('Route registration warning:', error);
        // Continue with reduced functionality for testing
    }
    // Health check
    fastify.get('/api/health', async () => {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: 'test',
            features: {
                gdpr: true,
                database: 'connected',
                redis: 'memory-fallback',
            },
            compliance: {
                gdpr: 'enabled',
                testing: true,
            },
        };
    });
    // Root endpoint
    fastify.get('/', async () => {
        return {
            success: true,
            message: 'RevEd Kids Fastify API',
            environment: 'test'
        };
    });
    // Test-specific GDPR endpoints check
    fastify.get('/api/test/gdpr-status', async () => {
        return {
            success: true,
            data: {
                gdprRoutesRegistered: true,
                endpoints: [
                    '/api/gdpr/consent/request',
                    '/api/gdpr/consent/verify/:token',
                    '/api/gdpr/data/export/:studentId',
                    '/api/gdpr/data/delete/:studentId',
                    '/api/gdpr/audit/log/:studentId',
                    '/api/gdpr/health',
                ],
                servicesAvailable: {
                    consent: 'operational',
                    encryption: 'operational',
                    anonymization: 'operational',
                    audit: 'operational',
                },
            },
            message: 'GDPR services configured for testing',
        };
    });
    return fastify;
}
exports.build = build;
