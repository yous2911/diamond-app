/**
 * Basic AuthService tests without complex setup
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn()
}));

describe('AuthService Basic Tests', () => {
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
});


