/**
 * Real Unit Tests - Testing actual functions without heavy mocking
 * Only mock external dependencies, test real business logic
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { EncryptionService } from '../services/encryption.service';
import { competenciesService } from '../services/competencies.service';

// Mock ONLY external dependencies
vi.mock('../db/connection', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  lt: vi.fn(),
  gt: vi.fn(),
  relations: vi.fn()
}));

describe('Real Unit Tests - Testing Actual Functions', () => {
  let authService: AuthService;
  let encryptionService: EncryptionService;

  beforeEach(() => {
    authService = new AuthService();
    encryptionService = new EncryptionService();
  });

  // Test 1: AuthService.hashPassword - REAL function, no mocking needed
  test('AuthService.hashPassword creates secure bcrypt hash', async () => {
    const password = 'testpassword123';
    const hash = await authService.hashPassword(password);
    
    // Test the REAL function
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50);
    expect(hash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt format
  });

  // Test 2: AuthService.verifyPassword - REAL function, no mocking needed
  test('AuthService.verifyPassword validates correct password', async () => {
    const password = 'testpassword123';
    const hash = await authService.hashPassword(password);
    
    // Test the REAL verification function
    const isValid = await authService.verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  // Test 3: AuthService.verifyPassword rejects wrong password
  test('AuthService.verifyPassword rejects incorrect password', async () => {
    const password = 'testpassword123';
    const wrongPassword = 'wrongpassword';
    const hash = await authService.hashPassword(password);
    
    // Test the REAL verification function
    const isValid = await authService.verifyPassword(wrongPassword, hash);
    expect(isValid).toBe(false);
  });

  // Test 4: EncryptionService.encryptSensitiveData - REAL function
  test('EncryptionService.encryptSensitiveData encrypts data', () => {
    const testData = 'This is sensitive information';
    const result = encryptionService.encryptSensitiveData(testData);
    
    // Test the REAL encryption function
    expect(result).toBeDefined();
    expect(result.encrypted).toBeDefined();
    expect(result.iv).toBeDefined();
    expect(result.tag).toBeDefined();
    expect(result.encrypted).not.toBe(testData);
  });

  // Test 5: EncryptionService.decryptSensitiveData - REAL function
  test('EncryptionService.decryptSensitiveData decrypts data correctly', () => {
    const originalData = 'This is sensitive information';
    const encrypted = encryptionService.encryptSensitiveData(originalData);
    const decrypted = encryptionService.decryptSensitiveData(encrypted);
    
    // Test the REAL decryption function
    expect(decrypted).toBe(originalData);
  });

  // Test 6: EncryptionService.hashPersonalData - REAL function
  test('EncryptionService.hashPersonalData creates consistent hash', () => {
    const data = 'personal@example.com';
    const hash1 = encryptionService.hashPersonalData(data);
    const hash2 = encryptionService.hashPersonalData(data);
    
    // Test the REAL hashing function
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA256 format
  });

  // Test 7: EncryptionService.generateSecureToken - REAL function
  test('EncryptionService.generateSecureToken creates unique tokens', () => {
    const token1 = encryptionService.generateSecureToken();
    const token2 = encryptionService.generateSecureToken();
    
    // Test the REAL token generation function
    expect(token1).not.toBe(token2);
    expect(token1).toMatch(/^[a-f0-9]{64}$/); // 32 bytes = 64 hex chars
    expect(token2).toMatch(/^[a-f0-9]{64}$/);
  });

  // Test 8: CompetenciesService.validateCompetencyCode - REAL function
  test('CompetenciesService.validateCompetencyCode validates correct format', () => {
    const validCodes = [
      'CP.FR.L.FL.01',
      'CE1.MA.N.CA.05',
      'CE2.FR.E.OR.10'
    ];

    // Test the REAL validation function
    validCodes.forEach(code => {
      expect(competenciesService.validateCompetencyCode(code)).toBe(true);
    });
  });

  // Test 9: CompetenciesService.validateCompetencyCode rejects invalid format
  test('CompetenciesService.validateCompetencyCode rejects invalid format', () => {
    const invalidCodes = [
      'INVALID',
      'CP.FR.L.FL',
      'CP.FR.L.FL.01.EXTRA',
      'CP.INVALID.L.FL.01'
    ];

    // Test the REAL validation function
    invalidCodes.forEach(code => {
      expect(competenciesService.validateCompetencyCode(code)).toBe(false);
    });
  });

  // Test 10: CompetenciesService.generateListCacheKey - REAL function
  test('CompetenciesService.generateListCacheKey creates correct cache key', () => {
    const filters = { level: 'CE2', subject: 'FR', limit: 10, offset: 0 };
    const key = competenciesService.generateListCacheKey(filters);
    
    // Test the REAL cache key generation function
    expect(key).toBe('comp:list:CE2:FR:10:0');
  });
});
