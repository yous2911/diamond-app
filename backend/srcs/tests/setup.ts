// src/tests/setup.ts - A more stable test setup
import { vi } from 'vitest';

// Mock JWT to prevent FAST_JWT_INVALID_KEY errors
vi.mock('@fastify/jwt', () => ({
  default: vi.fn(() => ({
    register: vi.fn(),
    sign: vi.fn(() => 'mock-jwt-token'),
    verify: vi.fn(() => ({ studentId: 1, role: 'student' })),
    decode: vi.fn(() => ({ studentId: 1, role: 'student' }))
  }))
}));

// Mock database connection for unit tests
vi.mock('../db/connection', () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockResolvedValue({ affectedRows: 1 }),
    execute: vi.fn().mockResolvedValue([{ test: 1 }]),
    transaction: vi.fn(async (callback) => {
      const tx = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue({ insertId: 'mock-audit-id-123' }),
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      return callback(tx);
    })
  };

  return {
    connectDatabase: vi.fn(() => Promise.resolve()),
    getDatabase: vi.fn(() => mockDb),
    testConnection: vi.fn(() => Promise.resolve(true)),
    checkDatabaseHealth: vi.fn(() => Promise.resolve({
      status: 'healthy',
      message: 'Mock database OK',
      responseTime: 5
    })),
    disconnectDatabase: vi.fn(() => Promise.resolve()),
    reconnectDatabase: vi.fn(() => Promise.resolve(true)),
    getPoolStats: vi.fn(() => Promise.resolve({
      activeConnections: 0,
      totalConnections: 10,
      idleConnections: 10,
      queuedRequests: 0
    })),
    db: mockDb,
    connection: {
      execute: vi.fn(() => Promise.resolve([{ test: 1 }])),
      getConnection: vi.fn(() => Promise.resolve({
        beginTransaction: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
        release: vi.fn(),
        execute: vi.fn(() => Promise.resolve([]))
      }))
    }
  };
});

// Mock EncryptionService
vi.mock('../services/encryption.service', () => {
  const mockEncryptionService = {
    encryptStudentData: vi.fn((data) => Promise.resolve({
      encryptedData: JSON.stringify(data),
      keyId: 'test-key-123'
    })),
    decryptStudentData: vi.fn((encryptedData) => Promise.resolve(JSON.parse(encryptedData.encryptedData))),
  };

  return {
    EncryptionService: vi.fn(() => mockEncryptionService)
  };
});
