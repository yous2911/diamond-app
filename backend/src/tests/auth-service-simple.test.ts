/**
 * Simple Unit Tests for AuthService Methods
 * Tests the actual AuthService class methods with proper mocking
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../services/auth.service';
import { AuthenticationError, ConflictError } from '../utils/AppError';

// Mock bcrypt
vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn()
}));

// Mock database connection with proper typing
vi.mock('../db/connection', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
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
  eq: vi.fn((field, value) => ({ field, value, operator: 'eq' })),
  and: vi.fn((...conditions) => ({ conditions, operator: 'and' })),
  lt: vi.fn((field, value) => ({ field, value, operator: 'lt' })),
  gt: vi.fn((field, value) => ({ field, value, operator: 'gt' }))
}));

// Mock crypto
vi.mock('crypto', () => ({
  randomBytes: vi.fn((size) => ({
    toString: vi.fn(() => 'mock-reset-token-123')
  }))
}));

// Mock students schema
vi.mock('../db/schema', () => ({
  students: {
    id: 'id',
    prenom: 'prenom',
    nom: 'nom',
    email: 'email',
    passwordHash: 'passwordHash',
    dateNaissance: 'dateNaissance',
    niveauActuel: 'niveauActuel',
    niveauScolaire: 'niveauScolaire',
    totalPoints: 'totalPoints',
    serieJours: 'serieJours',
    mascotteType: 'mascotteType',
    lockedUntil: 'lockedUntil',
    failedLoginAttempts: 'failedLoginAttempts',
    dernierAcces: 'dernierAcces',
    estConnecte: 'estConnecte',
    passwordResetToken: 'passwordResetToken',
    passwordResetExpires: 'passwordResetExpires',
    role: 'role'
  }
}));

import * as bcrypt from 'bcrypt';
import { db } from '../db/connection';

describe('AuthService Methods', () => {
  let authService: AuthService;
  let mockLogger: _any;

  beforeEach(() => {
    authService = new AuthService();
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('hashPassword', () => {
    test('should hash password with bcrypt', async () => {
      const mockHash = 'hashed-password-123';
      vi.mocked(bcrypt.hash).mockResolvedValue(mockHash);

      const result = await authService.hashPassword('test-password');

      expect(bcrypt.hash).toHaveBeenCalledWith('test-password', 12);
      expect(result).toBe(mockHash);
    });

    test('should handle bcrypt errors', async () => {
      vi.mocked(bcrypt.hash).mockRejectedValue(new Error('bcrypt error'));

      await expect(authService.hashPassword('test-password')).rejects.toThrow('bcrypt error');
    });
  });

  describe('verifyPassword', () => {
    test('should verify correct password', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(true);

      const result = await authService.verifyPassword('test-password', 'hashed-password');

      expect(bcrypt.compare).toHaveBeenCalledWith('test-password', 'hashed-password');
      expect(result).toBe(true);
    });

    test('should reject incorrect password', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(false);

      const result = await authService.verifyPassword('wrong-password', 'hashed-password');

      expect(result).toBe(false);
    });

    test('should return false for empty password', async () => {
      const result = await authService.verifyPassword('', 'hashed-password');

      expect(result).toBe(false);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test('should return false for empty hash', async () => {
      const result = await authService.verifyPassword('test-password', '');

      expect(result).toBe(false);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('isAccountLocked', () => {
    test('should return true when account is locked', async () => {
      const futureDate = new Date(Date.now() + 10000); // 10 seconds in future
      const mockStudent = [{
        id: 1,
        lockedUntil: futureDate
      }];

      vi.mocked(db).select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockStudent)
          })
        })
      });

      const result = await authService.isAccountLocked(1);

      expect(result).toBe(true);
    });

    test('should return false when account is not locked', async () => {
      const mockStudent = [{
        id: 1,
        lockedUntil: null
      }];

      vi.mocked(db).select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockStudent)
          })
        })
      });

      const result = await authService.isAccountLocked(1);

      expect(result).toBe(false);
    });

    test('should return false when lock has expired', async () => {
      const pastDate = new Date(Date.now() - 10000); // 10 seconds ago
      const mockStudent = [{
        id: 1,
        lockedUntil: pastDate
      }];

      vi.mocked(db).select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockStudent)
          })
        })
      });

      const result = await authService.isAccountLocked(1);

      expect(result).toBe(false);
    });

    test('should return false when student not found', async () => {
      vi.mocked(db).select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      const result = await authService.isAccountLocked(999);

      expect(result).toBe(false);
    });
  });

  describe('incrementFailedAttempts', () => {
    test('should increment failed attempts', async () => {
      const mockStudent = [{
        id: 1,
        failedLoginAttempts: 2
      }];

      vi.mocked(db).select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockStudent)
          })
        })
      });

      vi.mocked(db).update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });

      const result = await authService.incrementFailedAttempts(1);

      expect(result).toBe(3);
      expect(vi.mocked(db).update).toHaveBeenCalled();
    });

    test('should handle student with no previous attempts', async () => {
      const mockStudent = [{
        id: 1,
        failedLoginAttempts: null
      }];

      vi.mocked(db).select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockStudent)
          })
        })
      });

      vi.mocked(db).update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });

      const result = await authService.incrementFailedAttempts(1);

      expect(result).toBe(1);
    });

    test('should lock account when max attempts reached', async () => {
      const mockStudent = [{
        id: 1,
        failedLoginAttempts: 4
      }];

      vi.mocked(db).select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockStudent)
          })
        })
      });

      vi.mocked(db).update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });

      const result = await authService.incrementFailedAttempts(1);

      expect(result).toBe(5);
      // Should call update twice: once for increment, once for lock
      expect(vi.mocked(db).update).toHaveBeenCalledTimes(2);
    });

    test('should return 0 when student not found', async () => {
      vi.mocked(db).select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      const result = await authService.incrementFailedAttempts(999);

      expect(result).toBe(0);
    });
  });

  describe('resetFailedAttempts', () => {
    test('should reset failed attempts and unlock account', async () => {
      vi.mocked(db).update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });

      await authService.resetFailedAttempts(1);

      expect(vi.mocked(db).update).toHaveBeenCalled();
    });
  });

  describe('registerStudent', () => {
    test('should register new student successfully', async () => {
      const registerData = {
        prenom: 'John',
        nom: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        dateNaissance: '2010-01-01',
        niveauActuel: 'CE2'
      };

      // Mock email check - no existing student
      vi.mocked(db).select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      // Mock password hashing
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password');

      // Mock student creation
      vi.mocked(db).insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1 }])
        })
      });

      const result = await authService.registerStudent(registerData, mockLogger);

      expect(result).toEqual({
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        email: 'john@example.com',
        role: 'student',
        niveauActuel: 'CE2'
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        { email: 'john@example.com' },
        'Registering new student'
      );
    });

    test('should throw ConflictError for existing email', async () => {
      const registerData = {
        prenom: 'John',
        nom: 'Doe',
        email: 'existing@example.com',
        password: 'password123',
        dateNaissance: '2010-01-01',
        niveauActuel: 'CE2'
      };

      // Mock email check - existing student found
      vi.mocked(db).select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, email: 'existing@example.com' }])
          })
        })
      });

      await expect(authService.registerStudent(registerData, mockLogger))
        .rejects.toThrow(ConflictError);
    });
  });

  describe('authenticateStudent', () => {
    test('should authenticate student with email successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockStudent = {
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        role: 'student',
        niveauActuel: 'CE2',
        totalPoints: 100,
        serieJours: 5,
        mascotteType: 'dragon'
      };

      // Mock student lookup - first call returns student, second call returns lock status
      vi.mocked(db).select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockStudent])
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: 1, lockedUntil: null }])
            })
          })
        });

      // Mock password verification
      vi.mocked(bcrypt.compare).mockResolvedValue(true);

      // Mock reset failed attempts
      vi.mocked(db).update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });

      const result = await authService.authenticateStudent(credentials, mockLogger);

      expect(result).toEqual({
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        email: 'test@example.com',
        role: 'student',
        niveauActuel: 'CE2',
        totalPoints: 100,
        serieJours: 5,
        mascotteType: 'dragon'
      });
    });

    test('should authenticate student with name successfully', async () => {
      const credentials = {
        prenom: 'John',
        nom: 'Doe',
        password: 'password123'
      };

      const mockStudent = {
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        role: 'student',
        niveauActuel: 'CE2',
        totalPoints: 100,
        serieJours: 5,
        mascotteType: 'dragon'
      };

      // Mock student lookup by name - first call returns student, second call returns lock status
      vi.mocked(db).select
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockStudent])
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: 1, lockedUntil: null }])
            })
          })
        });

      // Mock password verification
      vi.mocked(bcrypt.compare).mockResolvedValue(true);

      // Mock reset failed attempts
      vi.mocked(db).update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });

      const result = await authService.authenticateStudent(credentials, mockLogger);

      expect(result).toEqual({
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        email: 'test@example.com',
        role: 'student',
        niveauActuel: 'CE2',
        totalPoints: 100,
        serieJours: 5,
        mascotteType: 'dragon'
      });
    });

    test('should throw AuthenticationError for non-existent student', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      // Mock student lookup - no student found
      vi.mocked(db).select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      await expect(authService.authenticateStudent(credentials, mockLogger))
        .rejects.toThrow(AuthenticationError);
    });

    test('should throw AuthenticationError for locked account', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockStudent = {
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        email: 'test@example.com',
        passwordHash: 'hashed-password'
      };

      // Mock student lookup
      vi.mocked(db).select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockStudent])
          })
        })
      });

      // Mock account locked
      const futureDate = new Date(Date.now() + 10000);
      vi.mocked(db).select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, lockedUntil: futureDate }])
          })
        })
      });

      await expect(authService.authenticateStudent(credentials, mockLogger))
        .rejects.toThrow(AuthenticationError);
    });

    test('should throw AuthenticationError for invalid password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrong-password'
      };

      const mockStudent = {
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        email: 'test@example.com',
        passwordHash: 'hashed-password'
      };

      // Mock student lookup
      vi.mocked(db).select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockStudent])
          })
        })
      });

      // Mock account not locked
      vi.mocked(db).select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, lockedUntil: null }])
          })
        })
      });

      // Mock password verification failure
      vi.mocked(bcrypt.compare).mockResolvedValue(false);

      // Mock increment failed attempts
      vi.mocked(db).select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, failedLoginAttempts: 0 }])
          })
        })
      });

      vi.mocked(db).update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });

      await expect(authService.authenticateStudent(credentials, mockLogger))
        .rejects.toThrow(AuthenticationError);
    });

    test('should throw AuthenticationError for student without password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockStudent = {
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        email: 'test@example.com',
        passwordHash: null
      };

      // Mock student lookup
      vi.mocked(db).select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockStudent])
          })
        })
      });

      // Mock account not locked
      vi.mocked(db).select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, lockedUntil: null }])
          })
        })
      });

      await expect(authService.authenticateStudent(credentials, mockLogger))
        .rejects.toThrow(AuthenticationError);
    });
  });

  describe('logoutStudent', () => {
    test('should logout student successfully', async () => {
      vi.mocked(db).update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });

      await authService.logoutStudent(1);

      expect(vi.mocked(db).update).toHaveBeenCalled();
    });
  });

  describe('generatePasswordResetToken', () => {
    test('should generate reset token for existing student', async () => {
      const mockStudent = [{ id: 1, email: 'test@example.com' }];

      vi.mocked(db).select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockStudent)
          })
        })
      });

      vi.mocked(db).update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });

      const result = await authService.generatePasswordResetToken('test@example.com');

      expect(result).toBe('mock-reset-token-123');
      expect(vi.mocked(db).update).toHaveBeenCalled();
    });

    test('should return null for non-existent student', async () => {
      vi.mocked(db).select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      const result = await authService.generatePasswordResetToken('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('resetPassword', () => {
    test('should reset password with valid token', async () => {
      const futureDate = new Date(Date.now() + 10000);
      const mockStudent = [{
        id: 1,
        passwordResetToken: 'valid-token',
        passwordResetExpires: futureDate
      }];

      vi.mocked(db).select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockStudent)
          })
        })
      });

      vi.mocked(bcrypt.hash).mockResolvedValue('new-hashed-password');

      vi.mocked(db).update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });

      const result = await authService.resetPassword('valid-token', 'new-password');

      expect(result).toBe(true);
      expect(vi.mocked(db).update).toHaveBeenCalled();
    });

    test('should return false for invalid token', async () => {
      vi.mocked(db).select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      const result = await authService.resetPassword('invalid-token', 'new-password');

      expect(result).toBe(false);
    });

    test('should return false for expired token', async () => {
      // For expired tokens, the database query should return no results
      // because the WHERE clause filters out expired tokens
      vi.mocked(db).select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]) // Empty array = no matching expired tokens
          })
        })
      });

      const result = await authService.resetPassword('expired-token', 'new-password');

      expect(result).toBe(false);
    });
  });
});
