/**
 * Simple test to debug AuthService import issues
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock all dependencies first
vi.mock('bcrypt');
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
vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  lt: vi.fn(),
  gt: vi.fn(),
  relations: vi.fn()
}));
vi.mock('crypto', () => ({
  randomBytes: vi.fn()
}));

describe('AuthService Simple Test', () => {
  it('should import AuthService correctly', async () => {
    // Import the AuthService after mocks are set up
    const { AuthService } = await import('../services/auth.service');
    
    // Create an instance
    const authService = new AuthService();
    
    // Check if the instance has the expected methods
    expect(authService).toBeDefined();
    expect(typeof authService.hashPassword).toBe('function');
    expect(typeof authService.verifyPassword).toBe('function');
    expect(typeof authService.isAccountLocked).toBe('function');
    expect(typeof authService.lockAccount).toBe('function');
    expect(typeof authService.incrementFailedAttempts).toBe('function');
    expect(typeof authService.resetFailedAttempts).toBe('function');
    expect(typeof authService.registerStudent).toBe('function');
    expect(typeof authService.authenticateStudent).toBe('function');
    expect(typeof authService.logoutStudent).toBe('function');
    expect(typeof authService.generatePasswordResetToken).toBe('function');
    expect(typeof authService.resetPassword).toBe('function');
  });

  it('should hash password', async () => {
    const { AuthService } = await import('../services/auth.service');
    const authService = new AuthService();
    
    // Mock bcrypt
    const bcrypt = await import('bcrypt');
    (bcrypt.hash as any).mockResolvedValue('hashedPassword123');
    
    const result = await authService.hashPassword('testPassword');
    
    expect(result).toBe('hashedPassword123');
    expect(bcrypt.hash).toHaveBeenCalledWith('testPassword', 12);
  });
});





