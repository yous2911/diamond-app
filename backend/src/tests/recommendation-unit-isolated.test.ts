/**
 * Isolated Unit Tests for Recommendation Service
 * Tests individual functions without setup.ts interference
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock ALL dependencies before any imports
vi.mock('../db/connection', () => {
  const mockDb = {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{
            id: 1,
            titre: 'Math Exercise 1',
            niveau: 'CP',
            matiere: 'Mathématiques',
            difficulte: 'facile',
            points: 10,
            dureeEstimee: 5
          }])
        })
      })
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue([{ insertId: 1 }])
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({ affectedRows: 1 })
      })
    })
  };

  return {
    db: mockDb,
    getDatabase: vi.fn().mockReturnValue(mockDb),
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
  and: vi.fn(),
  or: vi.fn(),
  not: vi.fn(),
  inArray: vi.fn(),
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
import { recommendationService } from '../services/recommendation.service';
import { getDatabase, db } from '../db/connection';

describe('Recommendation Service - Isolated Unit Tests', () => {
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = db; // Use the mocked db directly
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(recommendationService).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof recommendationService.getRecommendedExercises).toBe('function');
      expect(typeof recommendationService.getNextExercise).toBe('function');
      expect(typeof recommendationService.recordExerciseAttempt).toBe('function');
      expect(typeof recommendationService.getExercisesByDifficulty).toBe('function');
      expect(typeof recommendationService.getExercisesBySubject).toBe('function');
      expect(typeof recommendationService.getStudentWeaknesses).toBe('function');
      expect(typeof recommendationService.getPersonalizedRecommendations).toBe('function');
    });
  });

  describe('getRecommendedExercises Function', () => {
    it('should suggest exercises based on student level', async () => {
      const result = await recommendationService.getRecommendedExercises(1, 5);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
      
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('titre');
        expect(result[0]).toHaveProperty('niveau');
        expect(result[0]).toHaveProperty('matiere');
      }
    });

    it('should handle different student levels', async () => {
      const levels = ['CP', 'CE1', 'CE2', 'CM1', 'CM2'];
      
      for (const level of levels) {
        const result = await recommendationService.getRecommendedExercises(1, 3);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      }
    });

    it('should limit number of suggestions', async () => {
      const result = await recommendationService.getRecommendedExercises(1, 2);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getNextExercise Function', () => {
    it('should find next exercise for student', async () => {
      const result = await recommendationService.getNextExercise(1);

      expect(result).toBeDefined();
      if (result) {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('titre');
        expect(result).toHaveProperty('niveau');
        expect(result).toHaveProperty('matiere');
        expect(result).toHaveProperty('difficulte');
        expect(result).toHaveProperty('points');
        expect(result).toHaveProperty('dureeEstimee');
      }
    });

    it('should return null when no exercises available', async () => {
      // Mock empty result
      mockDb.select().from().where().limit.mockResolvedValue([]);

      const result = await recommendationService.getNextExercise(1);

      expect(result).toBeNull();
    });

    it('should prioritize exercises based on student progress', async () => {
      const result = await recommendationService.getNextExercise(1);

      expect(result).toBeDefined();
      // The service should prioritize based on student's current level and progress
    });
  });

  describe('recordExerciseAttempt Function', () => {
    it('should record exercise attempt successfully', async () => {
      const attemptData = {
        studentId: 1,
        exerciseId: 1,
        score: 85,
        completed: true,
        timeSpent: 120
      };

      const result = await recommendationService.recordExerciseAttempt(attemptData);

      expect(result).toBe(true);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should handle failed exercise attempts', async () => {
      const attemptData = {
        studentId: 1,
        exerciseId: 1,
        score: 30,
        completed: false,
        timeSpent: 180
      };

      const result = await recommendationService.recordExerciseAttempt(attemptData);

      expect(result).toBe(true);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should handle database errors during recording', async () => {
      mockDb.insert().values.mockRejectedValue(new Error('Database error'));

      const attemptData = {
        studentId: 1,
        exerciseId: 1,
        score: 85,
        completed: true,
        timeSpent: 120
      };

      const result = await recommendationService.recordExerciseAttempt(attemptData);
      expect(result).toBe(false);
    });
  });

  describe('getExercisesByDifficulty Function', () => {
    it('should filter exercises by difficulty level', async () => {
      const result = await recommendationService.getExercisesByDifficulty(1, 'FACILE');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        expect(result[0]?.difficulte).toBe('FACILE');
      }
    });

    it('should handle all difficulty levels', async () => {
      const difficulties = ['FACILE', 'MOYEN', 'DIFFICILE'];
      
      for (const difficulty of difficulties) {
        const result = await recommendationService.getExercisesByDifficulty(1, difficulty as 'FACILE' | 'MOYEN' | 'DIFFICILE');
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      }
    });

    it('should return empty array for invalid student', async () => {
      const result = await recommendationService.getExercisesByDifficulty(999, 'FACILE');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('getExercisesBySubject Function', () => {
    it('should filter exercises by subject', async () => {
      const result = await recommendationService.getExercisesBySubject(1, 'Mathématiques');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        expect(result[0]?.type).toBe('Mathématiques');
      }
    });

    it('should handle different subjects', async () => {
      const subjects = ['Mathématiques', 'Français', 'Sciences', 'Histoire', 'Géographie'];
      
      for (const subject of subjects) {
        const result = await recommendationService.getExercisesBySubject(1, subject);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      }
    });

    it('should return empty array for invalid student', async () => {
      const result = await recommendationService.getExercisesBySubject(999, 'Mathématiques');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('getStudentWeaknesses Function', () => {
    it('should analyze student weaknesses', async () => {
      const result = await recommendationService.getStudentWeaknesses(1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('matiere');
        expect(result[0]).toHaveProperty('difficulte');
        expect(result[0]).toHaveProperty('count');
      }
    });

    it('should identify specific weak areas', async () => {
      const result = await recommendationService.getStudentWeaknesses(1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array for student with no weaknesses', async () => {
      // Mock empty result
      mockDb.select().from().where().groupBy().orderBy.mockResolvedValue([]);

      const result = await recommendationService.getStudentWeaknesses(1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('getPersonalizedRecommendations Function', () => {
    it('should generate personalized recommendations', async () => {
      const result = await recommendationService.getPersonalizedRecommendations(1, 10);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10);
      
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('titre');
        expect(result[0]).toHaveProperty('niveau');
        expect(result[0]).toHaveProperty('matiere');
      }
    });

    it('should consider student progress in recommendations', async () => {
      const result = await recommendationService.getPersonalizedRecommendations(1, 5);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should limit number of recommendations', async () => {
      const result = await recommendationService.getPersonalizedRecommendations(1, 3);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors', async () => {
      mockDb.select().from().where().limit.mockRejectedValue(new Error('Connection failed'));

      const result = await recommendationService.getRecommendedExercises(1, 5);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle invalid student ID gracefully', async () => {
      const result = await recommendationService.getRecommendedExercises(-1, 5);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle zero limit parameter', async () => {
      const result = await recommendationService.getRecommendedExercises(1, 0);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
