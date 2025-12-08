/**
 * Unit Tests for EnhancedDatabaseService
 * Tests database operations, analytics, and progress tracking
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock database connection
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  execute: vi.fn()
};

vi.mock('../db/connection', () => ({
  getDatabase: vi.fn(() => mockDb),
  connectDatabase: vi.fn().mockResolvedValue(undefined),
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
  or: vi.fn((...conditions) => ({ conditions, operator: 'or' })),
  desc: vi.fn((field) => ({ field, direction: 'desc' })),
  asc: vi.fn((field) => ({ field, direction: 'asc' })),
  sql: vi.fn((query) => ({ query, type: 'sql' })),
  count: vi.fn((field) => ({ field, function: 'count' })),
  sum: vi.fn((field) => ({ field, function: 'sum' })),
  avg: vi.fn((field) => ({ field, function: 'avg' })),
  between: vi.fn((field, min, max) => ({ field, min, max, operator: 'between' })),
  inArray: vi.fn((field, values) => ({ field, values, operator: 'inArray' })),
  gte: vi.fn((field, value) => ({ field, value, operator: 'gte' })),
  lte: vi.fn((field, value) => ({ field, value, operator: 'lte' }))
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

// Mock enhanced cache service
vi.mock('../services/enhanced-cache.service', () => ({
  StudentCache: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn()
  }))
}));

// Mock database schema
vi.mock('../db/schema', () => ({
  students: {
    id: 'id',
    prenom: 'prenom',
    nom: 'nom',
    email: 'email',
    niveauActuel: 'niveauActuel',
    totalPoints: 'totalPoints',
    serieJours: 'serieJours'
  },
  exercises: {
    id: 'id',
    competenceCode: 'competenceCode',
    difficulty: 'difficulty',
    points: 'points'
  },
  studentProgress: {
    id: 'id',
    studentId: 'studentId',
    competenceCode: 'competenceCode',
    score: 'score',
    timeSpent: 'timeSpent',
    completed: 'completed'
  },
  studentCompetenceProgress: {
    id: 'id',
    studentId: 'studentId',
    competenceCode: 'competenceCode',
    masteryLevel: 'masteryLevel',
    lastPracticed: 'lastPracticed'
  },
  competencePrerequisites: {
    id: 'id',
    competenceCode: 'competenceCode',
    prerequisiteCode: 'prerequisiteCode'
  },
  dailyLearningAnalytics: {
    id: 'id',
    studentId: 'studentId',
    date: 'date',
    lessonsCompleted: 'lessonsCompleted',
    timeSpent: 'timeSpent'
  },
  weeklyProgressSummary: {
    id: 'id',
    studentId: 'studentId',
    weekStart: 'weekStart',
    totalLessons: 'totalLessons',
    averageScore: 'averageScore'
  },
  learningSessionTracking: {
    id: 'id',
    studentId: 'studentId',
    sessionStart: 'sessionStart',
    sessionEnd: 'sessionEnd',
    activitiesCompleted: 'activitiesCompleted'
  },
  exercisePerformanceAnalytics: {
    id: 'id',
    exerciseId: 'exerciseId',
    studentId: 'studentId',
    score: 'score',
    timeSpent: 'timeSpent'
  },
  studentAchievements: {
    id: 'id',
    studentId: 'studentId',
    achievementType: 'achievementType',
    earnedAt: 'earnedAt'
  },
  gdprConsentRequests: {
    id: 'id',
    studentId: 'studentId',
    requestType: 'requestType',
    status: 'status'
  },
  MasteryLevels: {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
    EXPERT: 'expert'
  }
}));

// Import after mocks
import { EnhancedDatabaseService } from '../services/enhanced-database.service';

describe('EnhancedDatabaseService', () => {
  let service: EnhancedDatabaseService;

  beforeEach(() => {
    service = new EnhancedDatabaseService();
    vi.clearAllMocks();
  });

  describe('Student Progress Tracking', () => {
    test('should record student progress', async () => {
      const progressData = {
        studentId: 1,
        competenceCode: 'CE2.FR.L.FL.01',
        score: 85,
        timeSpent: 300,
        completed: true,
        attempts: _2,
        exerciseId: 123
      };

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1, ...progressData }])
        })
      });

      const result = await service.recordStudentProgress(progressData);

      expect(result).toBeDefined();
      expect(mockDb.insert).toHaveBeenCalled();
    });

    test('should get student progress by competence', async () => {
      const studentId = 1;
      const competenceCode = 'CE2.FR.L.FL.01';

      const mockProgress = [{
        id: 1,
        studentId: 1,
        competenceCode: 'CE2.FR.L.FL.01',
        score: 85,
        timeSpent: 300,
        completed: true
      }];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockProgress)
          })
        })
      });

      const result = await service.getStudentProgressByCompetence(studentId, competenceCode);

      expect(result).toEqual(mockProgress);
      expect(mockDb.select).toHaveBeenCalled();
    });

    test('should get student overall progress', async () => {
      const studentId = 1;

      const mockProgress = [{
        competenceCode: 'CE2.FR.L.FL.01',
        averageScore: 85,
        totalTimeSpent: 300,
        lessonsCompleted: 5
      }];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockResolvedValue(mockProgress)
          })
        })
      });

      const result = await service.getStudentOverallProgress(studentId);

      expect(result).toEqual(mockProgress);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('Competence Management', () => {
    test('should get competence progress with filters', async () => {
      const filters = {
        matiere: 'FR',
        niveau: 'CE2',
        masteryLevel: 'intermediate',
        limit: 10,
        offset: 0
      };

      const mockProgress = [{
        id: 1,
        studentId: 1,
        competenceCode: 'CE2.FR.L.FL.01',
        masteryLevel: 'intermediate'
      }];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockResolvedValue(mockProgress)
            })
          })
        })
      });

      const result = await service.getCompetenceProgress(filters);

      expect(result).toEqual(mockProgress);
      expect(mockDb.select).toHaveBeenCalled();
    });

    test('should update competence mastery level', async () => {
      const studentId = 1;
      const competenceCode = 'CE2.FR.L.FL.01';
      const newMasteryLevel = 'advanced';

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });

      await service.updateCompetenceMasteryLevel(studentId, competenceCode, newMasteryLevel);

      expect(mockDb.update).toHaveBeenCalled();
    });

    test('should get competence prerequisites', async () => {
      const competenceCode = 'CE2.FR.L.FL.01';

      const mockPrerequisites = [{
        id: 1,
        competenceCode: 'CE2.FR.L.FL.01',
        prerequisiteCode: 'CE1.FR.L.FL.05'
      }];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockPrerequisites)
        })
      });

      const result = await service.getCompetencePrerequisites(competenceCode);

      expect(result).toEqual(mockPrerequisites);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('Analytics and Reporting', () => {
    test('should get daily learning analytics', async () => {
      const studentId = 1;
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      const mockAnalytics = [{
        id: 1,
        studentId: 1,
        date: '2024-01-01',
        lessonsCompleted: _3,
        timeSpent: 900
      }];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockAnalytics)
          })
        })
      });

      const result = await service.getDailyLearningAnalytics(studentId, startDate, endDate);

      expect(result).toEqual(mockAnalytics);
      expect(mockDb.select).toHaveBeenCalled();
    });

    test('should get weekly progress summary', async () => {
      const studentId = 1;
      const weekStart = '2024-01-01';

      const mockSummary = [{
        id: 1,
        studentId: 1,
        weekStart: '2024-01-01',
        totalLessons: _15,
        averageScore: 87
      }];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockSummary)
        })
      });

      const result = await service.getWeeklyProgressSummary(studentId, weekStart);

      expect(result).toEqual(mockSummary);
      expect(mockDb.select).toHaveBeenCalled();
    });

    test('should get learning session tracking', async () => {
      const studentId = 1;
      const sessionId = 'session-123';

      const mockSession = [{
        id: 1,
        studentId: 1,
        sessionStart: '2024-01-01T10:00:00Z',
        sessionEnd: '2024-01-01T11:00:00Z',
        activitiesCompleted: 5
      }];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockSession)
        })
      });

      const result = await service.getLearningSessionTracking(studentId, sessionId);

      expect(result).toEqual(mockSession);
      expect(mockDb.select).toHaveBeenCalled();
    });

    test('should get exercise performance analytics', async () => {
      const exerciseId = 123;
      const studentId = 1;

      const mockAnalytics = [{
        id: 1,
        exerciseId: 123,
        studentId: 1,
        score: _90,
        timeSpent: 120
      }];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockAnalytics)
        })
      });

      const result = await service.getExercisePerformanceAnalytics(exerciseId, studentId);

      expect(result).toEqual(mockAnalytics);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('Student Achievements', () => {
    test('should record student achievement', async () => {
      const achievementData = {
        studentId: 1,
        achievementType: 'first_lesson_completed',
        earnedAt: new Date()
      };

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1, ...achievementData }])
        })
      });

      const result = await service.recordStudentAchievement(achievementData);

      expect(result).toBeDefined();
      expect(mockDb.insert).toHaveBeenCalled();
    });

    test('should get student achievements', async () => {
      const studentId = 1;

      const mockAchievements = [{
        id: 1,
        studentId: 1,
        achievementType: 'first_lesson_completed',
        earnedAt: '2024-01-01T10:00:00Z'
      }];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockAchievements)
          })
        })
      });

      const result = await service.getStudentAchievements(studentId);

      expect(result).toEqual(mockAchievements);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('GDPR Compliance', () => {
    test('should record GDPR consent request', async () => {
      const consentData = {
        studentId: 1,
        requestType: 'data_export',
        status: 'pending'
      };

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1, ...consentData }])
        })
      });

      const result = await service.recordGDPRConsentRequest(consentData);

      expect(result).toBeDefined();
      expect(mockDb.insert).toHaveBeenCalled();
    });

    test('should get GDPR consent requests', async () => {
      const studentId = 1;

      const mockRequests = [{
        id: 1,
        studentId: 1,
        requestType: 'data_export',
        status: 'pending'
      }];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockRequests)
        })
      });

      const result = await service.getGDPRConsentRequests(studentId);

      expect(result).toEqual(mockRequests);
      expect(mockDb.select).toHaveBeenCalled();
    });

    test('should update GDPR consent request status', async () => {
      const requestId = 1;
      const newStatus = 'completed';

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });

      await service.updateGDPRConsentRequestStatus(requestId, newStatus);

      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('Data Integrity and Validation', () => {
    test('should validate student progress data', () => {
      const validData = {
        studentId: 1,
        competenceCode: 'CE2.FR.L.FL.01',
        score: 85,
        timeSpent: 300,
        completed: true
      };

      const isValid = service.validateProgressData(validData);

      expect(isValid).toBe(true);
    });

    test('should reject invalid student progress data', () => {
      const invalidData = {
        studentId: -1, // Invalid ID
        competenceCode: '', // Empty code
        score: _150, // Invalid score
        timeSpent: -100, // Negative time
        completed: true
      };

      const isValid = service.validateProgressData(invalidData);

      expect(isValid).toBe(false);
    });

    test('should validate competence code format', () => {
      const validCodes = [
        'CE2.FR.L.FL.01',
        'CE1.MA.N.CO.05',
        'CP.FR.E.PR.12'
      ];

      validCodes.forEach(code => {
        expect(service.validateCompetenceCode(code)).toBe(true);
      });
    });

    test('should reject invalid competence code format', () => {
      const invalidCodes = [
        'INVALID.CODE',
        'CE2.FR.L', // Too few parts
        'CE2.FR.L.FL.01.EXTRA', // Too many parts
        'CE3.FR.L.FL.01', // Invalid level
        ''
      ];

      invalidCodes.forEach(code => {
        expect(service.validateCompetenceCode(code)).toBe(false);
      });
    });
  });

  describe('Performance and Optimization', () => {
    test('should get database performance metrics', async () => {
      const mockMetrics = {
        totalQueries: _1000,
        averageQueryTime: _50,
        slowQueries: 5,
        connectionPoolSize: 10
      };

      mockDb.execute.mockResolvedValue(mockMetrics);

      const result = await service.getDatabasePerformanceMetrics();

      expect(result).toEqual(mockMetrics);
      expect(mockDb.execute).toHaveBeenCalled();
    });

    test('should optimize slow queries', async () => {
      const slowQueryId = 1;

      mockDb.execute.mockResolvedValue({ optimized: true });

      const result = await service.optimizeSlowQuery(slowQueryId);

      expect(result).toBeDefined();
      expect(mockDb.execute).toHaveBeenCalled();
    });

    test('should get query execution plan', async () => {
      const query = 'SELECT * FROM students WHERE id = ?';

      const mockPlan = {
        query: query,
        executionTime: _25,
        rowsExamined: 1,
        indexUsed: 'PRIMARY'
      };

      mockDb.execute.mockResolvedValue(mockPlan);

      const result = await service.getQueryExecutionPlan(query);

      expect(result).toEqual(mockPlan);
      expect(mockDb.execute).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      mockDb.select.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.getStudentOverallProgress(1)).rejects.toThrow('Database connection failed');
    });

    test('should handle invalid data gracefully', async () => {
      const invalidData = {
        studentId: _null,
        competenceCode: undefined,
        score: 'invalid',
        timeSpent: 'not_a_number',
        completed: 'maybe'
      };

      const result = service.validateProgressData(invalidData);

      expect(result).toBe(false);
    });

    test('should handle empty result sets', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([])
          })
        })
      });

      const result = await service.getStudentProgressByCompetence(999, 'NONEXISTENT.CODE');

      expect(result).toEqual([]);
    });
  });
});
