"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testUtils = exports.app = void 0;
// src/tests/setup-real-db.ts - Real Database Test setup
const vitest_1 = require("vitest");
const app_test_1 = require("../app-test");
const connection_1 = require("../db/connection");
const setup_1 = require("../db/setup");
// Load test environment variables
process.env.NODE_ENV = 'test';
// Mock JWT to prevent FAST_JWT_INVALID_KEY errors
vitest_1.vi.mock('@fastify/jwt', () => ({
    default: vitest_1.vi.fn(() => ({
        register: vitest_1.vi.fn(),
        sign: vitest_1.vi.fn(() => 'mock-jwt-token'),
        verify: vitest_1.vi.fn(() => ({ studentId: 1, role: 'student' })),
        decode: vitest_1.vi.fn(() => ({ studentId: 1, role: 'student' }))
    }))
}));
// Mock authentication middleware with real-like behavior
vitest_1.vi.mock('../middleware/auth.middleware', () => ({
    authenticateMiddleware: vitest_1.vi.fn(async (request, reply) => {
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
        if (token.startsWith('mock-jwt-token-') || token.startsWith('refreshed-token-')) {
            request.user = { studentId: 1, role: 'student' };
            return;
        }
        return reply.status(401).send({
            success: false,
            error: {
                message: 'Token invalide',
                code: 'INVALID_TOKEN'
            }
        });
    }),
    optionalAuthMiddleware: vitest_1.vi.fn(),
    authenticateAdminMiddleware: vitest_1.vi.fn(),
    authRateLimitMiddleware: vitest_1.vi.fn()
}));
// Mock Redis/Cache modules (still mocked for simplicity)
vitest_1.vi.mock('../utils/cache', () => ({
    getCachedData: vitest_1.vi.fn(() => Promise.resolve(null)),
    setCachedData: vitest_1.vi.fn(() => Promise.resolve()),
    deleteCachedData: vitest_1.vi.fn(() => Promise.resolve()),
    clearCache: vitest_1.vi.fn(() => Promise.resolve())
}));
// Mock Logger (still mocked)
vitest_1.vi.mock('../utils/logger', () => ({
    logger: {
        info: vitest_1.vi.fn(),
        error: vitest_1.vi.fn(),
        warn: vitest_1.vi.fn(),
        debug: vitest_1.vi.fn()
    }
}));
// Mock File System for upload tests
vitest_1.vi.mock('fs/promises', () => ({
    readFile: vitest_1.vi.fn(() => Promise.resolve(Buffer.from('test file content'))),
    writeFile: vitest_1.vi.fn(() => Promise.resolve()),
    unlink: vitest_1.vi.fn(() => Promise.resolve()),
    mkdir: vitest_1.vi.fn(() => Promise.resolve()),
    stat: vitest_1.vi.fn(() => Promise.resolve({ size: 1024 })),
    pathExists: vitest_1.vi.fn().mockResolvedValue(true),
}));
let setupComplete = false;
// Database test utilities
exports.testUtils = {
    async cleanDatabase() {
        const db = (0, connection_1.getDatabase)();
        // Clean test data in reverse order to respect foreign keys
        const tables = [
            'student_progress',
            'exercise_attempts',
            'audit_logs',
            'gdpr_requests',
            'consent_records',
            'students',
            'exercises',
            'competencies'
        ];
        for (const table of tables) {
            try {
                await db.execute(`DELETE FROM ${table} WHERE 1=1`);
            }
            catch (error) {
                // Table might not exist, continue
                console.log(`Warning: Could not clean table ${table}:`, error);
            }
        }
    },
    async seedTestData() {
        const db = (0, connection_1.getDatabase)();
        // Insert test student
        await db.insert({
            id: 1,
            prenom: 'Alice',
            nom: 'Test',
            email: 'alice.test@example.com',
            dateNaissance: new Date('2015-03-15'),
            niveauActuel: 'CP',
            niveauScolaire: 'CP',
            totalPoints: 150,
            serieJours: 5,
            mascotteType: 'dragon',
            createdAt: new Date(),
            updatedAt: new Date()
        }).into('students');
        // Insert test competency
        await db.insert({
            id: 1,
            code: 'CP.MA.NUM.01',
            titre: 'Compter jusqu\'à 10',
            description: 'Savoir compter de 1 à 10',
            niveau: 'CP',
            matiere: 'mathematiques',
            createdAt: new Date()
        }).into('competencies');
        // Insert test exercise
        await db.insert({
            id: 1,
            titre: 'Compter les pommes',
            competenceId: 1,
            niveau: 'CP',
            type: 'qcm',
            difficulte: 'decouverte',
            pointsMax: 10,
            tempsEstime: 120,
            contenu: JSON.stringify({
                question: 'Combien y a-t-il de pommes ?',
                reponses: ['5', '6', '7', '8'],
                bonneReponse: 1
            }),
            createdAt: new Date()
        }).into('exercises');
    }
};
(0, vitest_1.beforeAll)(async () => {
    if (setupComplete) {
        return;
    }
    try {
        console.log('🧪 Setting up real database test environment...');
        // Connect to test database
        await (0, connection_1.connectDatabase)();
        console.log('✅ Connected to test database');
        // Setup database schema
        await (0, setup_1.setupDatabase)();
        console.log('✅ Database schema ready');
        // Build the test app
        if (!exports.app) {
            exports.app = await (0, app_test_1.build)();
            await exports.app.ready();
            console.log('✅ Test app built and ready');
        }
        setupComplete = true;
        console.log('✅ Real database test environment setup complete');
    }
    catch (error) {
        console.error('❌ Real database test setup failed:', error);
        throw error;
    }
});
(0, vitest_1.beforeEach)(async () => {
    // Clean and seed test data before each test
    await exports.testUtils.cleanDatabase();
    await exports.testUtils.seedTestData();
    // Clear mocks between tests
    vitest_1.vi.clearAllMocks();
    // Ensure app is ready
    if (exports.app && !exports.app.server.listening) {
        await exports.app.ready();
    }
});
(0, vitest_1.afterAll)(async () => {
    try {
        // Clean up test data
        await exports.testUtils.cleanDatabase();
        console.log('✅ Test data cleaned up');
        // Disconnect from database
        await (0, connection_1.disconnectDatabase)();
        console.log('✅ Disconnected from test database');
        // Close app
        if (exports.app) {
            await exports.app.close();
            console.log('✅ Test app closed');
        }
    }
    catch (error) {
        console.error('❌ Test cleanup failed:', error);
    }
});
