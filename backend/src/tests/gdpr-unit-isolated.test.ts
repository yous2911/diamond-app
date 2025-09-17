/**
 * Isolated Unit Tests for GDPR Service
 * Tests individual functions without setup.ts interference
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock ALL dependencies before any imports
vi.mock('../db/connection', () => {
  const mockDb = {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  };
  
  return {
    getDatabase: vi.fn().mockReturnValue(mockDb),
    connectDatabase: vi.fn().mockResolvedValue(undefined),
    testConnection: vi.fn().mockResolvedValue(true),
    checkDatabaseHealth: vi.fn().mockResolvedValue({ status: 'healthy', uptime: 1000 }),
    disconnectDatabase: vi.fn().mockResolvedValue(undefined),
    reconnectDatabase: vi.fn().mockResolvedValue(true),
    getPoolStats: vi.fn().mockReturnValue({ activeConnections: 0, totalConnections: 10 })
  };
});

// Mock schema objects
vi.mock('../db/schema', () => ({
  students: { id: 'students.id', prenom: 'students.prenom', nom: 'students.nom' },
  studentProgress: { studentId: 'studentProgress.studentId' },
  sessions: { studentId: 'sessions.studentId' },
  revisions: { studentId: 'revisions.studentId' },
  gdprFiles: { studentId: 'gdprFiles.studentId' },
  gdprDataProcessingLog: { id: 'gdprDataProcessingLog.id' }
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  relations: vi.fn()
}));

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

// Import the service after all mocks are set up
import { gdprService } from '../services/gdpr.service';
import { getDatabase } from '../db/connection';

describe('GDPR Service - Isolated Unit Tests', () => {
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Get the mock database instance
    mockDb = getDatabase();
    
    // Setup mock chain for insert operations
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue([{ insertId: 1 }])
    });
    
    // Setup mock chain for select operations
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{
            id: 1,
            prenom: 'John',
            nom: 'Doe',
            email: 'john@example.com',
            dateNaissance: new Date('2010-01-01'),
            niveauActuel: 'CP',
            totalPoints: 100
          }])
        })
      })
    });
    
    // Setup mock chain for update operations
    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({ affectedRows: 1 })
      })
    });
    
    // Setup mock chain for delete operations
    mockDb.delete.mockReturnValue({
      where: vi.fn().mockResolvedValue({ affectedRows: 1 })
    });
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(gdprService).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof gdprService.logDataProcessing).toBe('function');
      expect(typeof gdprService.exportStudentData).toBe('function');
      expect(typeof gdprService.softDeleteStudentData).toBe('function');
      expect(typeof gdprService.hardDeleteStudentData).toBe('function');
      expect(typeof gdprService.convertToCSV).toBe('function');
    });
  });

  describe('logDataProcessing Function', () => {
    it('should log data processing with all fields', async () => {
      const data = {
        studentId: 1,
        action: 'READ' as const,
        dataType: 'student_profile',
        description: 'Student accessed their profile',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        requestId: 'req-123'
      };

      await gdprService.logDataProcessing(data);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.insert().values).toHaveBeenCalledWith({
        studentId: 1,
        action: 'READ',
        dataType: 'student_profile',
        details: 'Student accessed their profile',
        createdAt: expect.any(Date)
      });
    });

    it('should log data processing without optional fields', async () => {
      const data = {
        action: 'CREATE' as const,
        dataType: 'student_account',
        description: 'New student account created'
      };

      await gdprService.logDataProcessing(data);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.insert().values).toHaveBeenCalledWith({
        studentId: null,
        action: 'CREATE',
        dataType: 'student_account',
        details: 'New student account created',
        createdAt: expect.any(Date)
      });
    });

    it('should handle all GDPR action types', async () => {
      const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'ANONYMIZE'] as const;
      
      for (const action of actions) {
        await gdprService.logDataProcessing({
          action,
          dataType: 'test',
          description: `Test ${action} action`
        });
      }

      expect(mockDb.insert).toHaveBeenCalledTimes(6);
    });
  });

  describe('exportStudentData Function', () => {
    it('should export all student data successfully', async () => {
      const result = await gdprService.exportStudentData(1);

      expect(result).toBeDefined();
      expect(result.student).toBeDefined();
      expect(result.student.id).toBe(1);
      expect(result.student.prenom).toBe('John');
      expect(result.student.nom).toBe('Doe');
      expect(result.student.email).toBe('john@example.com');
    });

    it('should handle student not found', async () => {
      // Mock empty result
      mockDb.select().from().where().limit.mockResolvedValue([]);

      await expect(gdprService.exportStudentData(999))
        .rejects.toThrow('Student not found');
    });
  });

  describe('softDeleteStudentData Function', () => {
    it('should soft delete student data successfully', async () => {
      const result = await gdprService.softDeleteStudentData(1);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.affectedRecords).toBeGreaterThan(0);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should handle database errors during soft delete', async () => {
      mockDb.update().set().where.mockRejectedValue(new Error('Database error'));

      const result = await gdprService.softDeleteStudentData(1);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });
  });

  describe('hardDeleteStudentData Function', () => {
    it('should hard delete all student data in correct order', async () => {
      const result = await gdprService.hardDeleteStudentData(1);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.affectedRecords).toBeGreaterThan(0);
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should handle partial deletion failures', async () => {
      mockDb.delete().where.mockRejectedValue(new Error('Delete failed'));

      const result = await gdprService.hardDeleteStudentData(1);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Delete failed');
    });
  });

  describe('convertToCSV Function', () => {
    it('should convert student data to CSV format', () => {
      const data = {
        student: {
          id: 1,
          prenom: 'John',
          nom: 'Doe',
          email: 'john@example.com'
        }
      };

      const csv = gdprService.convertToCSV(data);

      expect(csv).toContain('Table,Field,Value');
      expect(csv).toContain('student,"id","1"');
      expect(csv).toContain('student,"prenom","John"');
      expect(csv).toContain('student,"nom","Doe"');
      expect(csv).toContain('student,"email","john@example.com"');
    });

    it('should convert complex nested data to CSV', () => {
      const data = {
        student: {
          id: 1,
          prenom: 'John',
          profile: {
            age: 25,
            grade: 'A'
          }
        }
      };

      const csv = gdprService.convertToCSV(data);

      expect(csv).toContain('Table,Field,Value');
      expect(csv).toContain('student,"id","1"');
      expect(csv).toContain('student,"prenom","John"');
      expect(csv).toContain('student,"profile.age","25"');
      expect(csv).toContain('student,"profile.grade","A"');
    });

    it('should handle arrays of objects in CSV conversion', () => {
      const data = {
        progress: [
          { id: 1, subject: 'Math' },
          { id: 2, subject: 'Science' }
        ]
      };

      const csv = gdprService.convertToCSV(data);

      expect(csv).toContain('Table,Field,Value');
      expect(csv).toContain('progress,"record_0.id","1"');
      expect(csv).toContain('progress,"record_0.subject","Math"');
      expect(csv).toContain('progress,"record_1.id","2"');
      expect(csv).toContain('progress,"record_1.subject","Science"');
    });

    it('should handle null and undefined values', () => {
      const data = {
        student: {
          id: 1,
          prenom: null,
          email: undefined,
          nom: 'Doe'
        }
      };

      const csv = gdprService.convertToCSV(data);

      expect(csv).toContain('Table,Field,Value');
      expect(csv).toContain('student,"id","1"');
      expect(csv).toContain('student,"prenom","null"');
      expect(csv).toContain('student,"email","undefined"');
      expect(csv).toContain('student,"nom","Doe"');
    });

    it('should handle empty data object', () => {
      const data = {};

      const csv = gdprService.convertToCSV(data);

      expect(csv).toBe('Table,Field,Value\n');
    });

    it('should escape special characters in CSV', () => {
      const data = {
        student: {
          prenom: 'John "The Great" Doe',
          description: 'Student with, comma and "quotes"'
        }
      };

      const csv = gdprService.convertToCSV(data);

      expect(csv).toContain('Table,Field,Value');
      expect(csv).toContain('student,"prenom","John \\"The Great\\" Doe"');
      expect(csv).toContain('student,"description","Student with, comma and \\"quotes\\""');
    });
  });

});
