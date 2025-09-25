/**
 * Unit tests for AuthService
 * Tests password hashing, authentication, registration, and security features
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AuthService } from '../services/auth.service';
import * as bcrypt from 'bcrypt';
import { db } from '../db/connection';
import { students } from '../db/schema';
import { eq, and, lt, gt } from 'drizzle-orm';
import * as crypto from 'crypto';

// Mock dependencies
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

describe('AuthService', () => {
  let authService: AuthService;
  let mockLogger: any;
  let mockDb: any;

  beforeEach(() => {
    authService = new AuthService();
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    };
    mockDb = db as any;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword123';
      
      (bcrypt.hash as any).mockResolvedValue(hashedPassword);

      const result = await authService.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });

    it('should handle bcrypt errors', async () => {
      const password = 'testPassword123';
      const error = new Error('bcrypt error');
      
      (bcrypt.hash as any).mockRejectedValue(error);

      await expect(authService.hashPassword(password)).rejects.toThrow('bcrypt error');
    });
  });

  describe('verifyPassword', () => {
    it('should return true for valid password', async () => {
      const password = 'testPassword123';
      const hash = 'hashedPassword123';
      
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await authService.verifyPassword(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for invalid password', async () => {
      const password = 'wrongPassword';
      const hash = 'hashedPassword123';
      
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await authService.verifyPassword(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });

    it('should return false for empty password', async () => {
      const result = await authService.verifyPassword('', 'hash');
      expect(result).toBe(false);
    });

    it('should return false for empty hash', async () => {
      const result = await authService.verifyPassword('password', '');
      expect(result).toBe(false);
    });

    it('should handle bcrypt errors', async () => {
      const password = 'testPassword123';
      const hash = 'hashedPassword123';
      const error = new Error('bcrypt error');
      
      (bcrypt.compare as any).mockRejectedValue(error);

      await expect(authService.verifyPassword(password, hash)).rejects.toThrow('bcrypt error');
    });
  });

  describe('isAccountLocked', () => {
    it('should return true when account is locked', async () => {
      const studentId = 1;
      const lockUntil = new Date(Date.now() + 10000); // 10 seconds in future
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{
            id: studentId,
            lockUntil: lockUntil,
            failedAttempts: 5
          }])
        })
      });
      
      mockDb.select = mockSelect;

      const result = await authService.isAccountLocked(studentId);

      expect(result).toBe(true);
    });

    it('should return false when account is not locked', async () => {
      const studentId = 1;
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{
            id: studentId,
            lockUntil: null,
            failedAttempts: 2
          }])
        })
      });
      
      mockDb.select = mockSelect;

      const result = await authService.isAccountLocked(studentId);

      expect(result).toBe(false);
    });

    it('should return false when student not found', async () => {
      const studentId = 999;
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      });
      
      mockDb.select = mockSelect;

      const result = await authService.isAccountLocked(studentId);

      expect(result).toBe(false);
    });
  });

  describe('lockAccount', () => {
    it('should lock account with correct lockout duration', async () => {
      const studentId = 1;
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });
      
      mockDb.update = mockUpdate;

      await authService.lockAccount(studentId);

      expect(mockDb.update).toHaveBeenCalledWith(students);
      expect(mockUpdate().set).toHaveBeenCalledWith({
        lockUntil: expect.any(Date),
        failedAttempts: 5
      });
    });
  });

  describe('incrementFailedAttempts', () => {
    it('should increment failed attempts', async () => {
      const studentId = 1;
      const currentAttempts = 2;
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{
            id: studentId,
            failedAttempts: currentAttempts
          }])
        })
      });
      
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });
      
      mockDb.select = mockSelect;
      mockDb.update = mockUpdate;

      const result = await authService.incrementFailedAttempts(studentId);

      expect(result).toBe(currentAttempts + 1);
      expect(mockUpdate().set).toHaveBeenCalledWith({
        failedAttempts: currentAttempts + 1
      });
    });

    it('should return 1 for new failed attempt', async () => {
      const studentId = 1;
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{
            id: studentId,
            failedAttempts: null
          }])
        })
      });
      
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });
      
      mockDb.select = mockSelect;
      mockDb.update = mockUpdate;

      const result = await authService.incrementFailedAttempts(studentId);

      expect(result).toBe(1);
    });
  });

  describe('resetFailedAttempts', () => {
    it('should reset failed attempts to 0', async () => {
      const studentId = 1;
      
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });
      
      mockDb.update = mockUpdate;

      await authService.resetFailedAttempts(studentId);

      expect(mockDb.update).toHaveBeenCalledWith(students);
      expect(mockUpdate().set).toHaveBeenCalledWith({
        failedAttempts: 0,
        lockUntil: null
      });
    });
  });

  describe('registerStudent', () => {
    const registerData = {
      prenom: 'John',
      nom: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      dateNaissance: '2010-01-01',
      niveauActuel: 'CE2'
    };

    it('should register new student successfully', async () => {
      const hashedPassword = 'hashedPassword123';
      const newStudent = { id: 1, ...registerData, password: hashedPassword };
      
      (bcrypt.hash as any).mockResolvedValue(hashedPassword);
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]) // No existing student
        })
      });
      
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newStudent])
        })
      });
      
      mockDb.select = mockSelect;
      mockDb.insert = mockInsert;

      const result = await authService.registerStudent(registerData, mockLogger);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerData.password, 12);
      expect(mockDb.insert).toHaveBeenCalledWith(students);
      expect(result).toEqual(newStudent);
      expect(mockLogger.info).toHaveBeenCalledWith(
        { email: registerData.email },
        'Registering new student'
      );
    });

    it('should throw ConflictError for existing email', async () => {
      const existingStudent = { id: 1, email: registerData.email };
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([existingStudent])
        })
      });
      
      mockDb.select = mockSelect;

      await expect(authService.registerStudent(registerData, mockLogger))
        .rejects.toThrow('Email already exists');
    });

    it('should handle database errors during registration', async () => {
      const hashedPassword = 'hashedPassword123';
      const error = new Error('Database error');
      
      (bcrypt.hash as any).mockResolvedValue(hashedPassword);
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      });
      
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(error)
        })
      });
      
      mockDb.select = mockSelect;
      mockDb.insert = mockInsert;

      await expect(authService.registerStudent(registerData, mockLogger))
        .rejects.toThrow('Database error');
    });
  });

  describe('authenticateStudent', () => {
    const credentials = {
      email: 'john.doe@example.com',
      password: 'password123'
    };

    it('should authenticate student successfully', async () => {
      const student = {
        id: 1,
        email: credentials.email,
        password: 'hashedPassword123',
        failedAttempts: 0,
        lockUntil: null
      };
      
      (bcrypt.compare as any).mockResolvedValue(true);
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([student])
        })
      });
      
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });
      
      mockDb.select = mockSelect;
      mockDb.update = mockUpdate;

      const result = await authService.authenticateStudent(credentials, mockLogger);

      expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, student.password);
      expect(result).toEqual(student);
      expect(mockLogger.info).toHaveBeenCalledWith(
        { email: credentials.email },
        'Authenticating student'
      );
    });

    it('should throw AuthenticationError for invalid credentials', async () => {
      const student = {
        id: 1,
        email: credentials.email,
        password: 'hashedPassword123',
        failedAttempts: 0,
        lockUntil: null
      };
      
      (bcrypt.compare as any).mockResolvedValue(false);
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([student])
        })
      });
      
      mockDb.select = mockSelect;

      await expect(authService.authenticateStudent(credentials, mockLogger))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw AuthenticationError for locked account', async () => {
      const student = {
        id: 1,
        email: credentials.email,
        password: 'hashedPassword123',
        failedAttempts: 5,
        lockUntil: new Date(Date.now() + 10000)
      };
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([student])
        })
      });
      
      mockDb.select = mockSelect;

      await expect(authService.authenticateStudent(credentials, mockLogger))
        .rejects.toThrow('Account is locked');
    });

    it('should throw NotFoundError for non-existent student', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      });
      
      mockDb.select = mockSelect;

      await expect(authService.authenticateStudent(credentials, mockLogger))
        .rejects.toThrow('Student not found');
    });
  });

  describe('logoutStudent', () => {
    it('should logout student successfully', async () => {
      const studentId = 1;
      
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });
      
      mockDb.update = mockUpdate;

      await authService.logoutStudent(studentId);

      expect(mockDb.update).toHaveBeenCalledWith(students);
      expect(mockUpdate().set).toHaveBeenCalledWith({
        estConnecte: false
      });
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate reset token for existing student', async () => {
      const email = 'john.doe@example.com';
      const student = { id: 1, email };
      const token = 'resetToken123';
      
      (crypto.randomBytes as any).mockReturnValue({ toString: () => token });
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([student])
        })
      });
      
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });
      
      mockDb.select = mockSelect;
      mockDb.update = mockUpdate;

      const result = await authService.generatePasswordResetToken(email);

      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(result).toBe(token);
      expect(mockUpdate().set).toHaveBeenCalledWith({
        resetToken: token,
        resetTokenExpires: expect.any(Date)
      });
    });

    it('should return null for non-existent student', async () => {
      const email = 'nonexistent@example.com';
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      });
      
      mockDb.select = mockSelect;

      const result = await authService.generatePasswordResetToken(email);

      expect(result).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const token = 'validToken123';
      const newPassword = 'newPassword123';
      const hashedPassword = 'hashedNewPassword123';
      const student = {
        id: 1,
        resetToken: token,
        resetTokenExpires: new Date(Date.now() + 10000)
      };
      
      (bcrypt.hash as any).mockResolvedValue(hashedPassword);
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([student])
        })
      });
      
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });
      
      mockDb.select = mockSelect;
      mockDb.update = mockUpdate;

      const result = await authService.resetPassword(token, newPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(result).toBe(true);
      expect(mockUpdate().set).toHaveBeenCalledWith({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null
      });
    });

    it('should return false for invalid token', async () => {
      const token = 'invalidToken';
      const newPassword = 'newPassword123';
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([])
        })
      });
      
      mockDb.select = mockSelect;

      const result = await authService.resetPassword(token, newPassword);

      expect(result).toBe(false);
    });

    it('should return false for expired token', async () => {
      const token = 'expiredToken123';
      const newPassword = 'newPassword123';
      const student = {
        id: 1,
        resetToken: token,
        resetTokenExpires: new Date(Date.now() - 10000) // Expired
      };
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([student])
        })
      });
      
      mockDb.select = mockSelect;

      const result = await authService.resetPassword(token, newPassword);

      expect(result).toBe(false);
    });
  });
});

