/**
 * REAL Unit Tests for AuthService
 * Tests actual functions, not mocks
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../services/auth.service';
import { db } from '../db/connection';
import { students } from '../db/schema';
import { eq } from 'drizzle-orm';

// Test with real database connection
describe('AuthService - Real Unit Tests', () => {
  let authService: AuthService;
  let testStudentId: number;

  beforeEach(async () => {
    authService = new AuthService();
    
    // Create a test student for testing
    const testStudent = await db.insert(students).values({
      prenom: 'Test',
      nom: 'User',
      email: 'test@example.com',
      passwordHash: await authService.hashPassword('testpassword123'),
      dateNaissance: new Date('2010-01-01'),
      niveauActuel: 'CE2',
      niveauScolaire: 'CE2',
      totalPoints: 0,
      serieJours: 0,
      mascotteType: 'dragon',
      failedLoginAttempts: 0,
      lockedUntil: null
    }).returning({ id: students.id });
    
    testStudentId = testStudent[0].id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testStudentId) {
      await db.delete(students).where(eq(students.id, testStudentId));
    }
  });

  describe('Password Hashing', () => {
    test('hashPassword creates secure hash', async () => {
      const password = 'testpassword123';
      const hash = await authService.hashPassword(password);
      
      // Test the REAL function
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
      expect(hash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt format
    });

    test('hashPassword creates different hashes for same password', async () => {
      const password = 'testpassword123';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);
      
      // Each hash should be unique due to salt
      expect(hash1).not.toBe(hash2);
    });

    test('hashPassword handles empty password', async () => {
      const hash = await authService.hashPassword('');
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('Password Verification', () => {
    test('verifyPassword correctly verifies valid password', async () => {
      const password = 'testpassword123';
      const hash = await authService.hashPassword(password);
      
      const isValid = await authService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    test('verifyPassword rejects invalid password', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hash = await authService.hashPassword(password);
      
      const isValid = await authService.verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    test('verifyPassword handles empty inputs', async () => {
      const result1 = await authService.verifyPassword('', 'hash');
      const result2 = await authService.verifyPassword('password', '');
      const result3 = await authService.verifyPassword('', '');
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
    });
  });

  describe('Account Lockout', () => {
    test('isAccountLocked returns false for unlocked account', async () => {
      const isLocked = await authService.isAccountLocked(testStudentId);
      expect(isLocked).toBe(false);
    });

    test('lockAccount locks account for specified duration', async () => {
      await authService.lockAccount(testStudentId);
      
      const isLocked = await authService.isAccountLocked(testStudentId);
      expect(isLocked).toBe(true);
    });

    test('incrementFailedAttempts increments counter', async () => {
      const attempts = await authService.incrementFailedAttempts(testStudentId);
      expect(attempts).toBe(1);
      
      const attempts2 = await authService.incrementFailedAttempts(testStudentId);
      expect(attempts2).toBe(2);
    });

    test('incrementFailedAttempts locks account after max attempts', async () => {
      // Increment to max attempts (5)
      for (let i = 0; i < 5; i++) {
        await authService.incrementFailedAttempts(testStudentId);
      }
      
      const isLocked = await authService.isAccountLocked(testStudentId);
      expect(isLocked).toBe(true);
    });

    test('resetFailedAttempts clears lockout', async () => {
      // Lock the account first
      await authService.lockAccount(testStudentId);
      expect(await authService.isAccountLocked(testStudentId)).toBe(true);
      
      // Reset attempts
      await authService.resetFailedAttempts(testStudentId);
      expect(await authService.isAccountLocked(testStudentId)).toBe(false);
    });
  });

  describe('Student Registration', () => {
    test('registerStudent creates new student with hashed password', async () => {
      const mockLogger = { info: () => {} };
      const studentData = {
        prenom: 'New',
        nom: 'Student',
        email: 'newstudent@example.com',
        password: 'newpassword123',
        dateNaissance: '2010-01-01',
        niveauActuel: 'CE2'
      };

      const result = await authService.registerStudent(studentData, mockLogger as any);
      
      expect(result).toBeDefined();
      expect(result.prenom).toBe('New');
      expect(result.nom).toBe('Student');
      expect(result.email).toBe('newstudent@example.com');
      expect(result.role).toBe('student');
      
      // Clean up
      await db.delete(students).where(eq(students.email, 'newstudent@example.com'));
    });

    test('registerStudent throws error for duplicate email', async () => {
      const mockLogger = { info: () => {} };
      const studentData = {
        prenom: 'Duplicate',
        nom: 'Student',
        email: 'test@example.com', // Same as existing test student
        password: 'password123',
        dateNaissance: '2010-01-01',
        niveauActuel: 'CE2'
      };

      await expect(authService.registerStudent(studentData, mockLogger as any))
        .rejects.toThrow('Un compte avec cette adresse email existe déjà');
    });
  });

  describe('Student Authentication', () => {
    test('authenticateStudent succeeds with valid credentials', async () => {
      const mockLogger = { info: () => {} };
      const credentials = {
        email: 'test@example.com',
        password: 'testpassword123'
      };

      const result = await authService.authenticateStudent(credentials, mockLogger as any);
      
      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(result.prenom).toBe('Test');
      expect(result.nom).toBe('User');
    });

    test('authenticateStudent fails with invalid email', async () => {
      const mockLogger = { info: () => {} };
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'testpassword123'
      };

      await expect(authService.authenticateStudent(credentials, mockLogger as any))
        .rejects.toThrow('Identifiants incorrects');
    });

    test('authenticateStudent fails with invalid password', async () => {
      const mockLogger = { info: () => {} };
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      await expect(authService.authenticateStudent(credentials, mockLogger as any))
        .rejects.toThrow('Mot de passe incorrect');
    });

    test('authenticateStudent fails when account is locked', async () => {
      // Lock the account first
      await authService.lockAccount(testStudentId);
      
      const mockLogger = { info: () => {} };
      const credentials = {
        email: 'test@example.com',
        password: 'testpassword123'
      };

      await expect(authService.authenticateStudent(credentials, mockLogger as any))
        .rejects.toThrow('Compte temporairement verrouillé');
    });
  });

  describe('Password Reset', () => {
    test('generatePasswordResetToken creates valid token', async () => {
      const token = await authService.generatePasswordResetToken('test@example.com');
      
      expect(token).toBeDefined();
      expect(token).toMatch(/^[a-f0-9]{64}$/); // 32 bytes = 64 hex chars
    });

    test('generatePasswordResetToken returns null for non-existent email', async () => {
      const token = await authService.generatePasswordResetToken('nonexistent@example.com');
      expect(token).toBeNull();
    });

    test('resetPassword works with valid token', async () => {
      // Generate token
      const token = await authService.generatePasswordResetToken('test@example.com');
      expect(token).toBeDefined();
      
      // Reset password
      const success = await authService.resetPassword(token!, 'newpassword123');
      expect(success).toBe(true);
      
      // Verify new password works
      const mockLogger = { info: () => {} };
      const credentials = {
        email: 'test@example.com',
        password: 'newpassword123'
      };
      
      const result = await authService.authenticateStudent(credentials, mockLogger as any);
      expect(result).toBeDefined();
    });

    test('resetPassword fails with invalid token', async () => {
      const success = await authService.resetPassword('invalid-token', 'newpassword123');
      expect(success).toBe(false);
    });
  });

  describe('Logout', () => {
    test('logoutStudent updates connection status', async () => {
      await authService.logoutStudent(testStudentId);
      
      // Verify the student is marked as disconnected
      const student = await db.select().from(students).where(eq(students.id, testStudentId)).limit(1);
      expect(student[0].estConnecte).toBe(false);
    });
  });
});



