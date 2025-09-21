// src/tests/setup-real-db.ts - Real Database Test setup
import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { build } from '../app-test';
import type { FastifyInstance } from 'fastify';
import { connectDatabase, disconnectDatabase, getDatabase } from '../db/connection';
import { setupDatabase, resetDatabase } from '../db/setup';

// Load test environment variables
process.env.NODE_ENV = 'test';

// Mock JWT to prevent FAST_JWT_INVALID_KEY errors
vi.mock('@fastify/jwt', () => ({
  default: vi.fn(() => ({
    register: vi.fn(),
    sign: vi.fn(() => 'mock-jwt-token'),
    verify: vi.fn(() => ({ studentId: 1, role: 'student' })),
    decode: vi.fn(() => ({ studentId: 1, role: 'student' }))
  }))
}));

// Mock authentication middleware with real-like behavior
vi.mock('../middleware/auth.middleware', () => ({
  authenticateMiddleware: vi.fn(async (request: any, reply: any) => {
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
  optionalAuthMiddleware: vi.fn(),
  authenticateAdminMiddleware: vi.fn(),
  authRateLimitMiddleware: vi.fn()
}));

// Mock Redis/Cache modules (still mocked for simplicity)
vi.mock('../utils/cache', () => ({
  getCachedData: vi.fn(() => Promise.resolve(null)),
  setCachedData: vi.fn(() => Promise.resolve()),
  deleteCachedData: vi.fn(() => Promise.resolve()),
  clearCache: vi.fn(() => Promise.resolve())
}));

// Mock Logger (still mocked)
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

// Mock File System for upload tests
vi.mock('fs/promises', () => ({
  readFile: vi.fn(() => Promise.resolve(Buffer.from('test file content'))),
  writeFile: vi.fn(() => Promise.resolve()),
  unlink: vi.fn(() => Promise.resolve()),
  mkdir: vi.fn(() => Promise.resolve()),
  stat: vi.fn(() => Promise.resolve({ size: 1024 })),
  pathExists: vi.fn().mockResolvedValue(true),
}));

// Keep the minimum necessary mocks for services that don't need real testing
// But remove database connection mocks to use real database

export let app: FastifyInstance;
let setupComplete = false;

// Database test utilities
export const testUtils = {
  async cleanDatabase() {
    const db = getDatabase();

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
      } catch (error) {
        // Table might not exist, continue
        console.log(`Warning: Could not clean table ${table}:`, error);
      }
    }
  },

  async seedTestData() {
    const db = getDatabase();

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

beforeAll(async () => {
  if (setupComplete) {
    return;
  }

  try {
    console.log('🧪 Setting up real database test environment...');

    // Connect to test database
    await connectDatabase();
    console.log('✅ Connected to test database');

    // Setup database schema
    await setupDatabase();
    console.log('✅ Database schema ready');

    // Build the test app
    if (!app) {
      app = await build();
      await app.ready();
      console.log('✅ Test app built and ready');
    }

    setupComplete = true;
    console.log('✅ Real database test environment setup complete');
  } catch (error) {
    console.error('❌ Real database test setup failed:', error);
    throw error;
  }
});

beforeEach(async () => {
  // Clean and seed test data before each test
  await testUtils.cleanDatabase();
  await testUtils.seedTestData();

  // Clear mocks between tests
  vi.clearAllMocks();

  // Ensure app is ready
  if (app && !app.server.listening) {
    await app.ready();
  }
});

afterAll(async () => {
  try {
    // Clean up test data
    await testUtils.cleanDatabase();
    console.log('✅ Test data cleaned up');

    // Disconnect from database
    await disconnectDatabase();
    console.log('✅ Disconnected from test database');

    // Close app
    if (app) {
      await app.close();
      console.log('✅ Test app closed');
    }
  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
  }
});