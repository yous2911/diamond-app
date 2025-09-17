/**
 * Unit tests for Recommendation Service
 * Tests personalized learning recommendations, progress tracking, and weakness analysis
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RecommendationService } from '../services/recommendation.service';
import { db } from '../db/connection';
import { students, exercises, progress } from '../db/schema';
import { eq, and, sql, not, desc } from 'drizzle-orm';

// Mock dependencies
vi.mock('../db/connection', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn()
  },
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
  sql: vi.fn((template) => template),
  not: vi.fn(),
  desc: vi.fn(),
  relations: vi.fn()
}));

describe('Recommendation Service', () => {
  let recommendationService: RecommendationService;
  let mockDb: any;

  beforeEach(() => {
    recommendationService = new RecommendationService();
    mockDb = db as any;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getRecommendedExercises', () => {
    it('should return recommended exercises for student', async () => {
      const studentId = 1;
      const mockStudent = [{
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        niveauActuel: 'CE2'
      }];

      const mockCompletedExercises = [
        { exerciseId: 1 },
        { exerciseId: 2 }
      ];

      const mockRecommendedExercises = [
        { id: 3, titre: 'Exercise 3', difficulte: 'CE2' },
        { id: 4, titre: 'Exercise 4', difficulte: 'CE2' }
      ];

      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockStudent)
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockCompletedExercises)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(mockRecommendedExercises)
              })
            })
          })
        });

      mockDb.select = mockSelect;

      const result = await recommendationService.getRecommendedExercises(studentId, 5);

      expect(result).toEqual(mockRecommendedExercises);
      expect(mockDb.select).toHaveBeenCalledTimes(3);
    });

    it('should return empty array for non-existent student', async () => {
      const studentId = 999;
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      mockDb.select = mockSelect;

      const result = await recommendationService.getRecommendedExercises(studentId);

      expect(result).toEqual([]);
    });

    it('should exclude completed exercises from recommendations', async () => {
      const studentId = 1;
      const mockStudent = [{ id: 1, niveauActuel: 'CE2' }];
      const mockCompletedExercises = [{ exerciseId: 1 }];
      const mockRecommendedExercises = [{ id: 2, titre: 'Exercise 2' }];

      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockStudent)
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockCompletedExercises)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(mockRecommendedExercises)
              })
            })
          })
        });

      mockDb.select = mockSelect;

      const result = await recommendationService.getRecommendedExercises(studentId);

      expect(result).toEqual(mockRecommendedExercises);
      // Should include NOT condition to exclude completed exercises
      expect(and).toHaveBeenCalledWith(
        expect.any(Function), // eq(schema.exercises.difficulte, student[0].niveauActuel)
        expect.any(Function)  // not(sql`...`)
      );
    });

    it('should handle database errors gracefully', async () => {
      const studentId = 1;
      const error = new Error('Database connection failed');
      mockDb.select = vi.fn().mockRejectedValue(error);

      const result = await recommendationService.getRecommendedExercises(studentId);

      expect(result).toEqual([]);
    });
  });

  describe('getNextExercise', () => {
    it('should return next exercise for student', async () => {
      const studentId = 1;
      const mockStudent = [{ id: 1, niveauActuel: 'CE2' }];
      const mockCompletedExercises = [{ exerciseId: 1 }];
      const mockNextExercise = [{ id: 2, titre: 'Next Exercise' }];

      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockStudent)
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockCompletedExercises)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(mockNextExercise)
              })
            })
          })
        });

      mockDb.select = mockSelect;

      const result = await recommendationService.getNextExercise(studentId);

      expect(result).toEqual(mockNextExercise[0]);
    });

    it('should filter by module when specified', async () => {
      const studentId = 1;
      const moduleId = 5;
      const mockStudent = [{ id: 1, niveauActuel: 'CE2' }];
      const mockCompletedExercises = [];
      const mockNextExercise = [{ id: 3, titre: 'Module Exercise' }];

      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockStudent)
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockCompletedExercises)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(mockNextExercise)
              })
            })
          })
        });

      mockDb.select = mockSelect;

      const result = await recommendationService.getNextExercise(studentId, moduleId);

      expect(result).toEqual(mockNextExercise[0]);
      // Should include module filter
      expect(and).toHaveBeenCalledWith(
        expect.any(Function), // niveauActuel condition
        expect.any(Function), // module condition
        expect.any(Function)  // not completed condition
      );
    });

    it('should return null for non-existent student', async () => {
      const studentId = 999;
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      mockDb.select = mockSelect;

      const result = await recommendationService.getNextExercise(studentId);

      expect(result).toBeNull();
    });
  });

  describe('recordExerciseAttempt', () => {
    it('should create new progress record for first attempt', async () => {
      const attemptData = {
        studentId: 1,
        exerciseId: 5,
        score: 85,
        completed: true,
        timeSpent: 120
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]) // No existing progress
          })
        })
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined)
      });

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });

      mockDb.select = mockSelect;
      mockDb.insert = mockInsert;
      mockDb.update = mockUpdate;

      const result = await recommendationService.recordExerciseAttempt(attemptData);

      expect(result).toBe(true);
      expect(mockDb.insert).toHaveBeenCalledWith(progress);
      expect(mockDb.update).toHaveBeenCalledWith(students); // Update total points
    });

    it('should update existing progress record', async () => {
      const attemptData = {
        studentId: 1,
        exerciseId: 5,
        score: 90,
        completed: true,
        timeSpent: 100
      };

      const existingProgress = [{
        studentId: 1,
        exerciseId: 5,
        completed: false,
        score: '50',
        attempts: 2,
        timeSpent: 200,
        completedAt: null
      }];

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(existingProgress)
          })
        })
      });

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });

      mockDb.select = mockSelect;
      mockDb.update = mockUpdate;

      const result = await recommendationService.recordExerciseAttempt(attemptData);

      expect(result).toBe(true);
      expect(mockDb.update).toHaveBeenCalledTimes(2); // Progress + student points
    });

    it('should not update student points for failed attempts', async () => {
      const attemptData = {
        studentId: 1,
        exerciseId: 5,
        score: 30,
        completed: false,
        timeSpent: 150
      };

      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined)
      });

      mockDb.select = mockSelect;
      mockDb.insert = mockInsert;

      const result = await recommendationService.recordExerciseAttempt(attemptData);

      expect(result).toBe(true);
      expect(mockDb.insert).toHaveBeenCalledWith(progress);
      expect(mockDb.update).not.toHaveBeenCalledWith(students); // No points update for failed attempt
    });

    it('should handle database errors gracefully', async () => {
      const attemptData = {
        studentId: 1,
        exerciseId: 5,
        score: 85,
        completed: true,
        timeSpent: 120
      };

      const error = new Error('Database error');
      mockDb.select = vi.fn().mockRejectedValue(error);

      const result = await recommendationService.recordExerciseAttempt(attemptData);

      expect(result).toBe(false);
    });
  });

  describe('getExercisesByDifficulty', () => {
    it('should return exercises filtered by difficulty', async () => {
      const studentId = 1;
      const difficulte = 'FACILE';
      const mockStudent = [{ id: 1, niveauActuel: 'CE2' }];
      const mockExercises = [
        { id: 1, titre: 'Easy Exercise 1', difficulte: 'FACILE' },
        { id: 2, titre: 'Easy Exercise 2', difficulte: 'FACILE' }
      ];

      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockStudent)
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockExercises)
            })
          })
        });

      mockDb.select = mockSelect;

      const result = await recommendationService.getExercisesByDifficulty(studentId, difficulte);

      expect(result).toEqual(mockExercises);
      expect(and).toHaveBeenCalledWith(
        expect.any(Function), // niveauActuel condition
        expect.any(Function)  // difficulty condition
      );
    });

    it('should return empty array for non-existent student', async () => {
      const studentId = 999;
      const difficulte = 'FACILE';
      const mockSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      });

      mockDb.select = mockSelect;

      const result = await recommendationService.getExercisesByDifficulty(studentId, difficulte);

      expect(result).toEqual([]);
    });
  });

  describe('getExercisesBySubject', () => {
    it('should return exercises filtered by subject', async () => {
      const studentId = 1;
      const matiere = 'mathematiques';
      const mockStudent = [{ id: 1, niveauActuel: 'CE2' }];
      const mockExercises = [
        { id: 1, titre: 'Math Exercise 1', type: 'mathematiques' },
        { id: 2, titre: 'Math Exercise 2', type: 'mathematiques' }
      ];

      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockStudent)
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockExercises)
            })
          })
        });

      mockDb.select = mockSelect;

      const result = await recommendationService.getExercisesBySubject(studentId, matiere);

      expect(result).toEqual(mockExercises);
      expect(and).toHaveBeenCalledWith(
        expect.any(Function), // niveauActuel condition
        expect.any(Function)  // subject condition
      );
    });
  });

  describe('getStudentWeaknesses', () => {
    it('should identify student weaknesses from failed exercises', async () => {
      const studentId = 1;
      const mockWeaknesses = [
        { matiere: 'mathematiques', difficulte: 'FACILE', count: 5 },
        { matiere: 'francais', difficulte: 'MOYEN', count: 3 }
      ];

      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                groupBy: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue(mockWeaknesses)
                })
              })
            })
          })
        })
      });

      mockDb.select = mockSelect;

      const result = await recommendationService.getStudentWeaknesses(studentId);

      expect(result).toEqual([
        { matiere: 'mathematiques', difficulte: 'FACILE', count: 5 },
        { matiere: 'francais', difficulte: 'MOYEN', count: 3 }
      ]);
    });

    it('should return empty array when no weaknesses found', async () => {
      const studentId = 1;
      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                groupBy: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue([])
                })
              })
            })
          })
        })
      });

      mockDb.select = mockSelect;

      const result = await recommendationService.getStudentWeaknesses(studentId);

      expect(result).toEqual([]);
    });
  });

  describe('getPersonalizedRecommendations', () => {
    it('should provide personalized recommendations based on weaknesses', async () => {
      const studentId = 1;
      const mockWeaknesses = [
        { matiere: 'mathematiques', difficulte: 'FACILE', count: 5 }
      ];

      const mockExercises = [
        { id: 1, titre: 'Math Practice 1', type: 'mathematiques', difficulte: 'FACILE' },
        { id: 2, titre: 'Math Practice 2', type: 'mathematiques', difficulte: 'FACILE' }
      ];

      // Mock getStudentWeaknesses
      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  groupBy: vi.fn().mockReturnValue({
                    orderBy: vi.fn().mockResolvedValue(mockWeaknesses)
                  })
                })
              })
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(mockExercises)
              })
            })
          })
        });

      mockDb.select = mockSelect;

      const result = await recommendationService.getPersonalizedRecommendations(studentId, 5);

      expect(result).toEqual(mockExercises);
    });

    it('should fall back to general recommendations when no weaknesses', async () => {
      const studentId = 1;
      const mockStudent = [{ id: 1, niveauActuel: 'CE2' }];
      const mockCompletedExercises = [];
      const mockRecommendedExercises = [
        { id: 3, titre: 'General Exercise 1' },
        { id: 4, titre: 'General Exercise 2' }
      ];

      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  groupBy: vi.fn().mockReturnValue({
                    orderBy: vi.fn().mockResolvedValue([]) // No weaknesses
                  })
                })
              })
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockStudent)
            })
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(mockCompletedExercises)
          })
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(mockRecommendedExercises)
              })
            })
          })
        });

      mockDb.select = mockSelect;

      const result = await recommendationService.getPersonalizedRecommendations(studentId, 5);

      expect(result).toEqual(mockRecommendedExercises);
    });

    it('should limit recommendations to specified count', async () => {
      const studentId = 1;
      const mockWeaknesses = [
        { matiere: 'mathematiques', difficulte: 'FACILE', count: 5 },
        { matiere: 'francais', difficulte: 'MOYEN', count: 3 },
        { matiere: 'sciences', difficulte: 'DIFFICILE', count: 2 }
      ];

      const mockExercises = [
        { id: 1, titre: 'Math Exercise' },
        { id: 2, titre: 'French Exercise' },
        { id: 3, titre: 'Science Exercise' },
        { id: 4, titre: 'Extra Exercise' }
      ];

      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  groupBy: vi.fn().mockReturnValue({
                    orderBy: vi.fn().mockResolvedValue(mockWeaknesses)
                  })
                })
              })
            })
          })
        })
        .mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(mockExercises)
              })
            })
          })
        });

      mockDb.select = mockSelect;

      const result = await recommendationService.getPersonalizedRecommendations(studentId, 3);

      expect(result).toHaveLength(3);
    });
  });

  describe('error handling', () => {
    it('should handle database errors in all methods', async () => {
      const error = new Error('Database connection failed');
      mockDb.select = vi.fn().mockRejectedValue(error);
      mockDb.insert = vi.fn().mockRejectedValue(error);
      mockDb.update = vi.fn().mockRejectedValue(error);

      const results = await Promise.all([
        recommendationService.getRecommendedExercises(1),
        recommendationService.getNextExercise(1),
        recommendationService.recordExerciseAttempt({
          studentId: 1,
          exerciseId: 1,
          score: 85,
          completed: true
        }),
        recommendationService.getExercisesByDifficulty(1, 'FACILE'),
        recommendationService.getExercisesBySubject(1, 'math'),
        recommendationService.getStudentWeaknesses(1),
        recommendationService.getPersonalizedRecommendations(1)
      ]);

      expect(results[0]).toEqual([]);
      expect(results[1]).toBeNull();
      expect(results[2]).toBe(false);
      expect(results[3]).toEqual([]);
      expect(results[4]).toEqual([]);
      expect(results[5]).toEqual([]);
      expect(results[6]).toEqual([]);
    });
  });
});
