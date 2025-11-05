/**
 * Standalone AuthService tests without global setup
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn()
}));

// Mock database connection
vi.mock('../db/connection', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn()
  },
  connectDatabase: vi.fn().mockResolvedValue(undefined),
  getDatabase: vi.fn().mockReturnValue({}),
  testConnection: vi.fn().mockResolvedValue(true),
  checkDatabaseHealth: vi.fn().mockResolvedValue({ status: 'healthy' }),
  disconnectDatabase: vi.fn().mockResolvedValue(undefined),
  reconnectDatabase: vi.fn().mockResolvedValue(true),
  withTransaction: vi.fn().mockImplementation((callback) => callback({})),
  getPoolStats: vi.fn().mockReturnValue({}),
  connection: {}
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  lt: vi.fn(),
  gt: vi.fn(),
  relations: vi.fn()
}));

// Mock crypto
vi.mock('crypto', () => ({
  randomBytes: vi.fn()
}));

// Mock AppError
vi.mock('../utils/AppError', () => ({
  AuthenticationError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthenticationError';
    }
  },
  ConflictError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ConflictError';
    }
  },
  NotFoundError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'NotFoundError';
    }
  }
}));

describe('AuthService Standalone Tests', () => {
  let authService: any;

  beforeEach(async () => {
    // Import AuthService after mocks are set up
    const { AuthService } = await import('../services/auth.service');
    authService = new AuthService();
  });

  it('should create AuthService instance', () => {
    expect(authService).toBeDefined();
    expect(authService.constructor.name).toBe('AuthService');
  });

  it('should have hashPassword method', () => {
    expect(typeof authService.hashPassword).toBe('function');
  });

  it('should have verifyPassword method', () => {
    expect(typeof authService.verifyPassword).toBe('function');
  });

  it('should hash password with bcrypt', async () => {
    const password = 'testPassword123';
    const hashedPassword = 'hashedPassword123';
    
    (bcrypt.hash as any).mockResolvedValue(hashedPassword);

    const result = await authService.hashPassword(password);

    expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    expect(result).toBe(hashedPassword);
  });

  it('should verify password with bcrypt', async () => {
    const password = 'testPassword123';
    const hash = 'hashedPassword123';
    
    (bcrypt.compare as any).mockResolvedValue(true);

    const result = await authService.verifyPassword(password, hash);

    expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
    expect(result).toBe(true);
  });

  it('should return false for empty password', async () => {
    const result = await authService.verifyPassword('', 'hash');
    expect(result).toBe(false);
  });

  it('should return false for empty hash', async () => {
    const result = await authService.verifyPassword('password', '');
    expect(result).toBe(false);
  });

  it('should handle bcrypt errors in hashPassword', async () => {
    const password = 'testPassword123';
    const error = new Error('bcrypt error');
    
    (bcrypt.hash as any).mockRejectedValue(error);

    await expect(authService.hashPassword(password)).rejects.toThrow('bcrypt error');
  });

  it('should handle bcrypt errors in verifyPassword', async () => {
    const password = 'testPassword123';
    const hash = 'hashedPassword123';
    const error = new Error('bcrypt error');
    
    (bcrypt.compare as any).mockRejectedValue(error);

    await expect(authService.verifyPassword(password, hash)).rejects.toThrow('bcrypt error');
  });
});












