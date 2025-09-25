/**
 * REAL Authentication Test - No Mocks
 * This tests your actual authentication code
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AuthService } from '../services/auth.service';
import * as bcrypt from 'bcrypt';

describe('REAL Authentication Tests', () => {
  let authService: AuthService;

  beforeAll(() => {
    authService = new AuthService();
  });

  it('should hash passwords with bcrypt', async () => {
    const password = 'testPassword123';
    const hash = await authService.hashPassword(password);
    
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
    
    // Verify the hash works
    const isValid = await authService.verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should verify correct passwords', async () => {
    const password = 'correctPassword';
    const hash = await authService.hashPassword(password);
    
    const isValid = await authService.verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect passwords', async () => {
    const correctPassword = 'correctPassword';
    const wrongPassword = 'wrongPassword';
    const hash = await authService.hashPassword(correctPassword);
    
    const isValid = await authService.verifyPassword(wrongPassword, hash);
    expect(isValid).toBe(false);
  });

  it('should handle empty passwords', async () => {
    const result = await authService.verifyPassword('', 'somehash');
    expect(result).toBe(false);
  });

  it('should handle empty hashes', async () => {
    const result = await authService.verifyPassword('password', '');
    expect(result).toBe(false);
  });
});









