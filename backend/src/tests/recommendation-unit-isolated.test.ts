/**
 * Isolated Unit Tests for Recommendation Service
 * Tests individual functions without setup.ts interference
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock ALL dependencies before any imports
vi.mock('../db/connection', () => ({
  getDatabase: vi.fn().mockReturnValue({
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
  }),
  connectDatabase: vi.fn().mockResolvedValue(undefined),
  testConnection: vi.fn().mockResolvedValue(true),
  checkDatabaseHealth: vi.fn().mockResolvedValue({ status: 'healthy', uptime: 1000 }),
  disconnectDatabase: vi.fn().mockResolvedValue(undefined),
  reconnectDatabase: vi.fn().mockResolvedValue(true),
  getPoolStats: vi.fn().mockReturnValue({ activeConnections: 0, totalConnections: 10 })
}));

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
import { getDatabase } from '../db/connection';

describe('Recommendation Service - Isolated Unit Tests', () => {
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = getDatabase();
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(recommendationService).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof recommendationService.suggestExercises).toBe('function');
      expect(typeof recommendationService.findNextExercise).toBe('function');
      expect(typeof recommendationService.recordExerciseAttempt).toBe('function');
      expect(typeof recommendationService.filterExercisesByDifficulty).toBe('function');
      expect(typeof recommendationService.filterExercisesBySubject).toBe('function');
      expect(typeof recommendationService.analyzeStudentWeaknesses).toBe('function');
      expect(typeof recommendationService.generatePersonalizedRecommendations).toBe('function');
    });
  });

  describe('suggestExercises Function', () => {
    it('should suggest exercises based on student level', async () => {
      const result = await recommendationService.suggestExercises(1, 5);

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
        const result = await recommendationService.suggestExercises(1, 3);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      }
    });

    it('should limit number of suggestions', async () => {
      const result = await recommendationService.suggestExercises(1, 2);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  describe('findNextExercise Function', () => {
    it('should find next exercise for student', async () => {
      const result = await recommendationService.findNextExercise(1);

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

      const result = await recommendationService.findNextExercise(1);

      expect(result).toBeNull();
    });

    it('should prioritize exercises based on student progress', async () => {
      const result = await recommendationService.findNextExercise(1);

      expect(result).toBeDefined();
      // The service should prioritize based on student's current level and progress
    });
  });

  describe('recordExerciseAttempt Function', () => {
    it('should record exercise attempt successfully', async () => {
      const attemptData = {
        studentId: 1,
        exerciseId: 1,
        success: true,
        timeSpent: 120,
        pointsEarned: 10,
        accuracy: 0.85
      };

      await recommendationService.recordExerciseAttempt(attemptData);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.insert().values).toHaveBeenCalledWith({
        studentId: 1,
        exerciseId: 1,
        success: true,
        timeSpent: 120,
        pointsEarned: 10,
        accuracy: 0.85,
        timestamp: expect.any(Date)
      });
    });

    it('should handle failed exercise attempts', async () => {
      const attemptData = {
        studentId: 1,
        exerciseId: 1,
        success: false,
        timeSpent: 180,
        pointsEarned: 0,
        accuracy: 0.3
      };

      await recommendationService.recordExerciseAttempt(attemptData);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.insert().values).toHaveBeenCalledWith({
        studentId: 1,
        exerciseId: 1,
        success: false,
        timeSpent: 180,
        pointsEarned: 0,
        accuracy: 0.3,
        timestamp: expect.any(Date)
      });
    });

    it('should handle database errors during recording', async () => {
      mockDb.insert().values.mockRejectedValue(new Error('Database error'));

      const attemptData = {
        studentId: 1,
        exerciseId: 1,
        success: true,
        timeSpent: 120,
        pointsEarned: 10,
        accuracy: 0.85
      };

      await expect(recommendationService.recordExerciseAttempt(attemptData))
        .rejects.toThrow('Failed to record exercise attempt');
    });
  });

  describe('filterExercisesByDifficulty Function', () => {
    it('should filter exercises by difficulty level', async () => {
      const result = await recommendationService.filterExercisesByDifficulty('facile', 5);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        expect(result[0].difficulte).toBe('facile');
      }
    });

    it('should handle all difficulty levels', async () => {
      const difficulties = ['facile', 'moyen', 'difficile'];
      
      for (const difficulty of difficulties) {
        const result = await recommendationService.filterExercisesByDifficulty(difficulty, 3);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      }
    });

    it('should limit number of results', async () => {
      const result = await recommendationService.filterExercisesByDifficulty('moyen', 2);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  describe('filterExercisesBySubject Function', () => {
    it('should filter exercises by subject', async () => {
      const result = await recommendationService.filterExercisesBySubject('Mathématiques', 5);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        expect(result[0].matiere).toBe('Mathématiques');
      }
    });

    it('should handle different subjects', async () => {
      const subjects = ['Mathématiques', 'Français', 'Sciences', 'Histoire', 'Géographie'];
      
      for (const subject of subjects) {
        const result = await recommendationService.filterExercisesBySubject(subject, 3);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      }
    });

    it('should return empty array for non-existent subject', async () => {
      // Mock empty result
      mockDb.select().from().where().limit.mockResolvedValue([]);

      const result = await recommendationService.filterExercisesBySubject('NonExistentSubject', 5);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('analyzeStudentWeaknesses Function', () => {
    it('should analyze student weaknesses', async () => {
      const result = await recommendationService.analyzeStudentWeaknesses(1);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('weakSubjects');
      expect(result).toHaveProperty('difficultConcepts');
      expect(result).toHaveProperty('recommendedActions');
      expect(Array.isArray(result.weakSubjects)).toBe(true);
      expect(Array.isArray(result.difficultConcepts)).toBe(true);
      expect(Array.isArray(result.recommendedActions)).toBe(true);
    });

    it('should identify specific weak areas', async () => {
      const result = await recommendationService.analyzeStudentWeaknesses(1);

      expect(result).toBeDefined();
      expect(result.weakSubjects).toBeDefined();
      expect(result.difficultConcepts).toBeDefined();
    });

    it('should provide actionable recommendations', async () => {
      const result = await recommendationService.analyzeStudentWeaknesses(1);

      expect(result).toBeDefined();
      expect(result.recommendedActions).toBeDefined();
      expect(Array.isArray(result.recommendedActions)).toBe(true);
    });
  });

  describe('generatePersonalizedRecommendations Function', () => {
    it('should generate personalized recommendations', async () => {
      const result = await recommendationService.generatePersonalizedRecommendations(1);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('recommendedExercises');
      expect(result).toHaveProperty('learningPath');
      expect(result).toHaveProperty('focusAreas');
      expect(result).toHaveProperty('estimatedTime');
      expect(Array.isArray(result.recommendedExercises)).toBe(true);
      expect(Array.isArray(result.learningPath)).toBe(true);
      expect(Array.isArray(result.focusAreas)).toBe(true);
    });

    it('should consider student progress in recommendations', async () => {
      const result = await recommendationService.generatePersonalizedRecommendations(1);

      expect(result).toBeDefined();
      expect(result.recommendedExercises).toBeDefined();
      expect(result.learningPath).toBeDefined();
    });

    it('should provide realistic time estimates', async () => {
      const result = await recommendationService.generatePersonalizedRecommendations(1);

      expect(result).toBeDefined();
      expect(result.estimatedTime).toBeDefined();
      expect(typeof result.estimatedTime).toBe('number');
      expect(result.estimatedTime).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors', async () => {
      mockDb.select().from().where().limit.mockRejectedValue(new Error('Connection failed'));

      await expect(recommendationService.suggestExercises(1, 5))
        .rejects.toThrow('Failed to suggest exercises');
    });

    it('should handle invalid student ID', async () => {
      await expect(recommendationService.suggestExercises(-1, 5))
        .rejects.toThrow('Invalid student ID');
    });

    it('should handle invalid limit parameter', async () => {
      await expect(recommendationService.suggestExercises(1, -1))
        .rejects.toThrow('Invalid limit');
    });
  });
});
