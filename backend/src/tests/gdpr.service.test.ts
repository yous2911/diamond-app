/**
 * Unit tests for GDPR Service
 * Tests data processing logging, data export, soft/hard deletion, and CSV conversion
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { gdprService } from '../services/gdpr.service';
import { db, getDatabase } from '../db/connection';
import { 
  students, studentProgress, sessions, revisions, gdprFiles, 
  gdprDataProcessingLog 
} from '../db/schema';
import { eq } from 'drizzle-orm';

// Mock dependencies
vi.mock('../db/connection', () => {
  const mockDb = {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined)
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([])
        })
      })
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined)
      })
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined)
    })
  };

  return {
    db: {
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    getDatabase: vi.fn(() => mockDb),
    connectDatabase: vi.fn().mockResolvedValue(undefined),
    testConnection: vi.fn().mockResolvedValue(true),
    checkDatabaseHealth: vi.fn().mockResolvedValue({ status: 'healthy', uptime: 1000 }),
    disconnectDatabase: vi.fn().mockResolvedValue(undefined),
    reconnectDatabase: vi.fn().mockResolvedValue(true),
    getPoolStats: vi.fn().mockReturnValue({ activeConnections: 0, totalConnections: 10 })
  };
});

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  inArray: vi.fn(),
  relations: vi.fn()
}));

describe('GDPR Service', () => {
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Get reference to the mocked database
    mockDb = getDatabase();
  });

  it('should have the correct service methods', () => {
    expect(gdprService).toBeDefined();
    expect(typeof gdprService.logDataProcessing).toBe('function');
    expect(typeof gdprService.exportStudentData).toBe('function');
    expect(typeof gdprService.softDeleteStudentData).toBe('function');
    expect(typeof gdprService.hardDeleteStudentData).toBe('function');
    expect(typeof gdprService.convertToCSV).toBe('function');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('logDataProcessing', () => {
    it('should log data processing with all fields', async () => {
      const logData = {
        studentId: 1,
        action: 'READ' as const,
        dataType: 'student_profile',
        description: 'Student accessed their profile',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        requestId: 'req-123'
      };

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined)
      });
      mockDb.insert = mockInsert;

      await gdprService.logDataProcessing(logData);

      expect(mockDb.insert).toHaveBeenCalledWith(gdprDataProcessingLog);
      expect(mockInsert().values).toHaveBeenCalledWith({
        studentId: 1,
        action: 'READ',
        dataType: 'student_profile',
        details: 'Student accessed their profile',
        createdAt: expect.any(Date)
      });
    });

    it('should log data processing without optional fields', async () => {
      const logData = {
        action: 'DELETE' as const,
        dataType: 'student_data',
        description: 'Student data deleted'
      };

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined)
      });
      mockDb.insert = mockInsert;

      await gdprService.logDataProcessing(logData);

      expect(mockDb.insert).toHaveBeenCalledWith(gdprDataProcessingLog);
      expect(mockInsert().values).toHaveBeenCalledWith({
        studentId: null,
        action: 'DELETE',
        dataType: 'student_data',
        details: 'Student data deleted',
        createdAt: expect.any(Date)
      });
    });

    it('should handle all GDPR action types', async () => {
      const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'ANONYMIZE'] as const;
      
      for (const action of actions) {
        const mockInsert = vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined)
        });
        mockDb.insert = mockInsert;

        await gdprService.logDataProcessing({
          action,
          dataType: 'test_data',
          description: `Testing ${action} action`
        });

        expect(mockInsert().values).toHaveBeenCalledWith({
          studentId: null,
          action,
          dataType: 'test_data',
          details: `Testing ${action} action`,
          createdAt: expect.any(Date)
        });
      }
    });
  });

  describe('exportStudentData', () => {
    it('should export all student data successfully', async () => {
      const studentId = 1;
      const mockStudentData = [{
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        email: 'john.doe@example.com'
      }];
      const mockProgressData = [{ id: 1, studentId: 1, score: 85 }];
      const mockSessionsData = [{ id: 1, studentId: 1, startTime: new Date() }];
      const mockRevisionsData = [{ id: 1, studentId: 1, exerciseId: 1 }];
      const mockFilesData = [{ id: 1, studentId: 1, filename: 'test.jpg' }];

      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockStudentData)
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockProgressData)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockSessionsData)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockRevisionsData)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockFilesData)
          })
        });

      mockDb.select = mockSelect;

      const result = await gdprService.exportStudentData(studentId);

      expect(result).toEqual({
        student: mockStudentData[0],
        progress: mockProgressData,
        sessions: mockSessionsData,
        revisions: mockRevisionsData,
        files: mockFilesData,
        exportedAt: expect.any(String),
        dataTypes: ['student', 'progress', 'sessions', 'revisions', 'files']
      });

      expect(mockDb.select).toHaveBeenCalledTimes(5);
    });

    it('should handle student not found', async () => {
      const studentId = 999;
      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([])
            })
          })
        })
        .mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([])
          })
        });

      mockDb.select = mockSelect;

      const result = await gdprService.exportStudentData(studentId);

      expect(result.student).toBeNull();
      expect(result.progress).toEqual([]);
      expect(result.sessions).toEqual([]);
      expect(result.revisions).toEqual([]);
      expect(result.files).toEqual([]);
    });
  });

  describe('softDeleteStudentData', () => {
    it('should soft delete student data successfully', async () => {
      const studentId = 1;
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ affectedRows: 1 })
        })
      });
      mockDb.update = mockUpdate;

      const result = await gdprService.softDeleteStudentData(studentId);

      expect(result).toEqual({
        success: true,
        affectedRecords: 1
      });

      expect(mockDb.update).toHaveBeenCalledWith(students);
      expect(mockUpdate().set).toHaveBeenCalledWith({
        estConnecte: _false,
        dernierAcces: null,
        updatedAt: expect.any(Date)
      });
    });

    it('should handle database errors during soft delete', async () => {
      const studentId = 1;
      const error = new Error('Database error');
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(error)
        })
      });
      mockDb.update = mockUpdate;

      await expect(gdprService.softDeleteStudentData(studentId))
        .rejects.toThrow('Database error');
    });
  });

  describe('hardDeleteStudentData', () => {
    it('should hard delete all student data in correct order', async () => {
      const studentId = 1;
      const mockDelete = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({ affectedRows: 1 })
      });
      mockDb.delete = mockDelete;

      const result = await gdprService.hardDeleteStudentData(studentId);

      expect(result).toEqual({
        success: true,
        affectedRecords: 5
      });

      // Verify deletion order (reverse dependency order)
      expect(mockDb.delete).toHaveBeenNthCalledWith(1, gdprFiles);
      expect(mockDb.delete).toHaveBeenNthCalledWith(2, revisions);
      expect(mockDb.delete).toHaveBeenNthCalledWith(3, sessions);
      expect(mockDb.delete).toHaveBeenNthCalledWith(4, studentProgress);
      expect(mockDb.delete).toHaveBeenNthCalledWith(5, students);
    });

    it('should handle partial deletion failures', async () => {
      const studentId = 1;
      const error = new Error('Delete failed');
      const mockDelete = vi.fn()
        .mockReturnValueOnce({
          where: vi.fn().mockResolvedValue({ affectedRows: 1 })
        })
        .mockReturnValueOnce({
          where: vi.fn().mockRejectedValue(error)
        });
      mockDb.delete = mockDelete;

      await expect(gdprService.hardDeleteStudentData(studentId))
        .rejects.toThrow('Delete failed');
    });
  });

  describe('convertToCSV', () => {
    it('should convert simple student data to CSV', () => {
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
            age: 10,
            level: 'CE2'
          }
        },
        progress: [
          { id: 1, score: 85 },
          { id: 2, score: 90 }
        ]
      };

      const csv = gdprService.convertToCSV(data);

      expect(csv).toContain('student,"id","1"');
      expect(csv).toContain('student,"profile.age","10"');
      expect(csv).toContain('student,"profile.level","CE2"');
      expect(csv).toContain('progress,"record_0.id","1"');
      expect(csv).toContain('progress,"record_0.score","85"');
      expect(csv).toContain('progress,"record_1.id","2"');
      expect(csv).toContain('progress,"record_1.score","90"');
    });

    it('should handle arrays of objects in CSV conversion', () => {
      const data = {
        sessions: [
          { id: 1, duration: 30 },
          { id: 2, duration: 45 }
        ]
      };

      const csv = gdprService.convertToCSV(data);

      expect(csv).toContain('sessions,"record_0.id","1"');
      expect(csv).toContain('sessions,"record_0.duration","30"');
      expect(csv).toContain('sessions,"record_1.id","2"');
      expect(csv).toContain('sessions,"record_1.duration","45"');
    });

    it('should handle null and undefined values', () => {
      const data = {
        student: {
          id: 1,
          prenom: null,
          nom: undefined,
          email: 'test@example.com'
        }
      };

      const csv = gdprService.convertToCSV(data);

      expect(csv).toContain('student,"id","1"');
      expect(csv).toContain('student,"prenom","null"');
      expect(csv).toContain('student,"nom","undefined"');
      expect(csv).toContain('student,"email","test@example.com"');
    });

    it('should handle empty data object', () => {
      const data = {};
      const csv = gdprService.convertToCSV(data);

      expect(csv).toBe('Table,Field,Value\n');
    });

    it('should escape special characters in CSV', () => {
      const data = {
        student: {
          prenom: 'John "Johnny" Doe',
          description: 'Student with "quotes" and, commas'
        }
      };

      const csv = gdprService.convertToCSV(data);

      expect(csv).toContain('student,"prenom","John "Johnny" Doe"');
      expect(csv).toContain('student,"description","Student with "quotes" and, commas"');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete GDPR workflow', async () => {
      const studentId = 1;
      
      // Mock all database operations
      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined)
      });
      
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 1, prenom: 'John' }])
          })
        })
      });
      
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ affectedRows: 1 })
        })
      });

      mockDb.insert = mockInsert;
      mockDb.select = mockSelect;
      mockDb.update = mockUpdate;

      // 1. Log data processing
      await gdprService.logDataProcessing({
        studentId,
        action: 'EXPORT',
        dataType: 'student_data',
        description: 'GDPR data export requested'
      });

      // 2. Export data
      const exportedData = await gdprService.exportStudentData(studentId);

      // 3. Convert to CSV
      const csv = gdprService.convertToCSV(exportedData);

      // 4. Soft delete
      const softDeleteResult = await gdprService.softDeleteStudentData(studentId);

      expect(mockInsert).toHaveBeenCalled();
      expect(exportedData).toBeDefined();
      expect(csv).toContain('Table,Field,Value');
      expect(softDeleteResult.success).toBe(true);
    });
  });
});
