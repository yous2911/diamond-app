/**
 * REAL TESTS - No Mocks, Testing Actual Code
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AuthService } from '../services/auth.service';
import { db } from '../db/connection';
import { students } from '../db/schema';

describe('REAL CODE TESTS', () => {
  let authService: AuthService;

  beforeAll(async () => {
    authService = new AuthService();
  });

  describe('Authentication Service - REAL TESTS', () => {
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

    it('should reject incorrect passwords', async () => {
      const correctPassword = 'correctPassword';
      const wrongPassword = 'wrongPassword';
      const hash = await authService.hashPassword(correctPassword);
      
      const isValid = await authService.verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it('should handle empty inputs', async () => {
      const result1 = await authService.verifyPassword('', 'somehash');
      const result2 = await authService.verifyPassword('password', '');
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });
  });

  describe('Database Connection - REAL TESTS', () => {
    it('should connect to database', async () => {
      // Test actual database connection
      const result = await db.select().from(students).limit(1);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should have students table', async () => {
      // Test that students table exists and is accessible
      const result = await db.select().from(students).limit(1);
      expect(result).toBeDefined();
    });
  });
});



