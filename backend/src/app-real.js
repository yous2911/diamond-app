"use strict";
// src/app-real.ts - App builder for real database tests (NO MOCKS)
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
exports.buildRealApp = void 0;
const fastify_1 = __importDefault(require("fastify"));
const service_factory_1 = require("./services/service-factory");
const connection_1 = require("./db/connection");
async function buildRealApp() {
    // Ensure we're using the real database
    await (0, connection_1.connectDatabase)();
    const fastify = (0, fastify_1.default)({
        logger: {
            level: 'warn', // Reduce log noise in tests
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                },
            }
        },
        ignoreTrailingSlash: true,
        disableRequestLogging: false, // Enable for debugging
        trustProxy: true,
        bodyLimit: 10485760, // 10MB
    });
    // Register core services (real services, not mocks)
    fastify.decorate('services', {
        encryption: service_factory_1.ServiceFactory.getEncryptionService(),
        email: service_factory_1.ServiceFactory.getEmailService(),
        audit: service_factory_1.ServiceFactory.getAuditTrailService(),
        storage: service_factory_1.ServiceFactory.getStorageService(),
        fileSecurity: service_factory_1.ServiceFactory.getFileSecurityService(),
        imageProcessing: service_factory_1.ServiceFactory.getImageProcessingService()
    });
    // Register plugins with real database connections
    try {
        await fastify.register(Promise.resolve().then(() => __importStar(require('./plugins/database'))));
        await fastify.register(Promise.resolve().then(() => __importStar(require('./plugins/cors'))));
        await fastify.register(Promise.resolve().then(() => __importStar(require('./plugins/csrf'))));
        await fastify.register(Promise.resolve().then(() => __importStar(require('./plugins/auth'))));
        await fastify.register(Promise.resolve().then(() => __importStar(require('./plugins/validation'))));
        console.log('✅ Real database plugins registered successfully');
    }
    catch (error) {
        console.error('❌ Plugin registration failed:', error);
        throw error;
    }
    // Register routes that we want to test
    try {
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/auth'))), { prefix: '/api/auth' });
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/students'))), { prefix: '/api/students' });
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/exercises'))), { prefix: '/api/exercises' });
        await fastify.register(Promise.resolve().then(() => __importStar(require('./routes/upload'))), { prefix: '/api/upload' });
        console.log('✅ Routes registered successfully');
    }
    catch (error) {
        console.error('❌ Route registration failed:', error);
        throw error;
    }
    // Health check endpoint
    fastify.get('/api/health', async () => {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: 'test-real-db',
            database: 'real',
            mocks: 'disabled'
        };
    });
    return fastify;
}
exports.buildRealApp = buildRealApp;
