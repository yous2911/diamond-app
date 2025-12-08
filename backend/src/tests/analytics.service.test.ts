/**
 * Unit tests for Analytics Service
 * Tests learning insights, student analytics, daily analytics updates, and streak calculations
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { analyticsService } from '../services/analytics.service';
import { db } from '../db/connection';
import { students, exercises } from '../db/schema';
import { eq, and, desc, asc, sql, count, sum, avg, between, gte, lte, inArray } from 'drizzle-orm';

// Mock dependencies
vi.mock('../db/connection', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  getDatabase: vi.fn(() => ({
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  })),
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
  desc: vi.fn(),
  asc: vi.fn(),
  sql: vi.fn((template) => template),
  count: vi.fn(),
  sum: vi.fn(),
  avg: vi.fn(),
  between: vi.fn(),
  gte: vi.fn(),
  lte: vi.fn(),
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

describe('Analytics Service', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = db as any;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getLearningInsights', () => {
    it('should get learning insights for month timeframe', async () => {
      const mockSelect = vi.fn()
        // Total students count
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockResolvedValue([{ count: 100 }])
          })
        })
        // Total exercises count
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockResolvedValue([{ count: 50 }])
          })
        })
        // Active students count
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ count: 80 }])
            })
          })
        })
        // Completed exercises count
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ count: 200 }])
            })
          })
        })
        // Top performing students
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                groupBy: vi.fn().mockReturnValue({
                  having: vi.fn().mockReturnValue({
                    orderBy: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue([
                        { studentId: 1, completionRate: 95, averageScore: 88, totalXP: 500 }
                      ])
                    })
                  })
                })
              })
            })
          })
        })
        // Student details for top performers
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{
                id: 1,
                prenom: 'John',
                nom: 'Doe',
                email: 'john@example.com'
              }])
            })
          })
        })
        // Subject analysis
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  groupBy: vi.fn().mockResolvedValue([
                    { subject: 'math', exerciseCount: 20, averageScore: 85, completionRate: 90 }
                  ])
                })
              })
            })
          })
        })
        // Difficulty analysis
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  groupBy: vi.fn().mockResolvedValue([
                    { difficulty: 'facile', exerciseCount: 15, averageScore: 90, averageTime: 120 }
                  ])
                })
              })
            })
          })
        });

      mockDb.select = mockSelect;

      const result = await analyticsService.getLearningInsights('month');

      expect(result).toEqual({
        totalStudents: 100,
        activeStudents: 80,
        totalExercises: 50,
        completedExercises: 200,
        averageCompletionRate: 5, // 200 / (50 * 80) * 100
        topPerformingStudents: [{
          student: {
            id: 1,
            prenom: 'John',
            nom: 'Doe',
            email: 'john@example.com'
          },
          completionRate: 95,
          averageScore: 88,
          totalXP: 500
        }],
        subjectAnalysis: [{
          subject: 'math',
          exerciseCount: 20,
          averageScore: 85,
          completionRate: 90
        }],
        difficultyAnalysis: [{
          difficulty: 'facile',
          exerciseCount: 15,
          averageScore: 90,
          averageTime: 120
        }]
      });
    });

    it('should handle different timeframes', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockResolvedValue([{ count: 10 }])
        })
      });
      mockDb.select = mockSelect;

      // Test week timeframe
      await analyticsService.getLearningInsights('week');
      
      // Test year timeframe
      await analyticsService.getLearningInsights('year');

      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should handle zero division in completion rate calculation', async () => {
      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockResolvedValue([{ count: 0 }])
          })
        })
        .mockReturnValue({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ count: 0 }])
            })
          })
        });

      mockDb.select = mockSelect;

      const result = await analyticsService.getLearningInsights('month');

      expect(result.averageCompletionRate).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');
      mockDb.select = vi.fn().mockRejectedValue(error);

      await expect(analyticsService.getLearningInsights('month'))
        .rejects.toThrow('Failed to generate learning insights');
    });
  });

  describe('getStudentAnalytics', () => {
    it('should get comprehensive student analytics', async () => {
      const studentId = 1;
      const mockStudent = {
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        email: 'john@example.com',
        niveauActuel: 'CE2'
      };

      const mockSelect = vi.fn()
        // Student details
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([mockStudent])
            })
          })
        })
        // Progress metrics
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{
                totalExercises: 20,
                completedExercises: 15,
                averageScore: 85.5,
                totalTimeSpent: 1200,
                xpEarned: 150
              }])
            })
          })
        })
        // Competence progress
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([
                {
                  competenceCode: 'CE2.MATH.ADD.01',
                  masteryLevel: 'maitrise',
                  successfulAttempts: 8,
                  totalAttempts: 10
                }
              ])
            })
          })
        })
        // Recent activity
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([
                    {
                      date: new Date('2024-01-15'),
                      completedExercises: 3,
                      totalTimeMinutes: 45,
                      averageScore: 90
                    }
                  ])
                })
              })
            })
          })
        })
        // Achievements
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue([
                  {
                    title: 'First Exercise',
                    description: 'Completed your first exercise',
                    unlockedAt: new Date('2024-01-10'),
                    xpReward: 10
                  }
                ])
              })
            })
          })
        })
        // Streak calculation
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([
                    { date: new Date('2024-01-15') },
                    { date: new Date('2024-01-14') },
                    { date: new Date('2024-01-13') }
                  ])
                })
              })
            })
          })
        });

      mockDb.select = mockSelect;

      const result = await analyticsService.getStudentAnalytics(studentId);

      expect(result).toEqual({
        student: mockStudent,
        totalExercises: 20,
        completedExercises: 15,
        completionRate: _75, // 15/20 * 100
        averageScore: 85.5,
        totalTimeSpent: 1200,
        xpEarned: 150,
        currentStreak: 3,
        competenceProgress: [{
          competenceCode: 'CE2.MATH.ADD.01',
          masteryLevel: 'maitrise',
          progress: 80 // 8/10 * 100
        }],
        recentActivity: [{
          date: new Date('2024-01-15'),
          exercisesCompleted: 3,
          timeSpent: 45,
          averageScore: 90
        }],
        achievements: [{
          title: 'First Exercise',
          description: 'Completed your first exercise',
          earnedAt: new Date('2024-01-10'),
          xpReward: 10
        }]
      });
    });

    it('should throw error for non-existent student', async () => {
      const studentId = 999;
      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([])
          })
        })
      });
      mockDb.select = mockSelect;

      await expect(analyticsService.getStudentAnalytics(studentId))
        .rejects.toThrow('Student not found');
    });

    it('should handle zero progress metrics', async () => {
      const studentId = 1;
      const mockStudent = { id: 1, prenom: 'John', nom: 'Doe' };

      const mockSelect = vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([mockStudent])
            })
          })
        })
        .mockReturnValue({
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{
                totalExercises: 0,
                completedExercises: 0,
                averageScore: null,
                totalTimeSpent: null,
                xpEarned: null
              }])
            })
          })
        });

      mockDb.select = mockSelect;

      const result = await analyticsService.getStudentAnalytics(studentId);

      expect(result.completionRate).toBe(0);
      expect(result.averageScore).toBe(0);
      expect(result.totalTimeSpent).toBe(0);
      expect(result.xpEarned).toBe(0);
    });
  });

  describe('updateDailyAnalytics', () => {
    it('should update daily analytics for student', async () => {
      const studentId = 1;
      const date = new Date('2024-01-15');

      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{
              totalExercises: 5,
              completedExercises: 4,
              totalTimeMinutes: 30,
              averageScore: 85.5,
              competencesWorked: 2
            }])
          })
        })
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined)
      });

      mockDb.select = mockSelect;
      mockDb.insert = mockInsert;

      await analyticsService.updateDailyAnalytics(studentId, date);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockInsert().values).toHaveBeenCalledWith({
        studentId: 1,
        date: new Date('2024-01-15'),
        totalExercises: 5,
        completedExercises: 4,
        totalTimeMinutes: 30,
        averageScore: '85.50',
        competencesWorked: 2
      });
    });

    it('should handle null values in daily metrics', async () => {
      const studentId = 1;
      const date = new Date('2024-01-15');

      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{
              totalExercises: null,
              completedExercises: null,
              totalTimeMinutes: null,
              averageScore: null,
              competencesWorked: null
            }])
          })
        })
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined)
      });

      mockDb.select = mockSelect;
      mockDb.insert = mockInsert;

      await analyticsService.updateDailyAnalytics(studentId, date);

      expect(mockInsert().values).toHaveBeenCalledWith({
        studentId: 1,
        date: new Date('2024-01-15'),
        totalExercises: 0,
        completedExercises: 0,
        totalTimeMinutes: 0,
        averageScore: '0.00',
        competencesWorked: 0
      });
    });

    it('should handle database errors in daily analytics update', async () => {
      const studentId = 1;
      const date = new Date('2024-01-15');
      const error = new Error('Database error');

      mockDb.select = vi.fn().mockRejectedValue(error);

      // Should not throw error, just log it
      await expect(analyticsService.updateDailyAnalytics(studentId, date))
        .resolves.toBeUndefined();
    });
  });

  describe('calculateCurrentStreak', () => {
    it('should calculate current streak correctly', async () => {
      const studentId = 1;
      const today = new Date('2024-01-15');
      
      // Mock recent days with completed exercises
      const recentDays = [
        { date: new Date('2024-01-15') }, // Today
        { date: new Date('2024-01-14') }, // Yesterday
        { date: new Date('2024-01-13') }, // Day before
        { date: new Date('2024-01-11') }  // Gap - should break streak
      ];

      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(recentDays)
              })
            })
          })
        })
      });

      mockDb.select = mockSelect;

      // Mock the private method by accessing it through the service
      const result = await (analyticsService as any).calculateCurrentStreak(studentId);

      expect(result).toBe(3); // Should count consecutive days from today
    });

    it('should return 0 for no recent activity', async () => {
      const studentId = 1;

      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([])
              })
            })
          })
        })
      });

      mockDb.select = mockSelect;

      const result = await (analyticsService as any).calculateCurrentStreak(studentId);

      expect(result).toBe(0);
    });

    it('should handle errors in streak calculation', async () => {
      const studentId = 1;
      const error = new Error('Database error');

      mockDb.select = vi.fn().mockRejectedValue(error);

      const result = await (analyticsService as any).calculateCurrentStreak(studentId);

      expect(result).toBe(0);
    });
  });

  describe('getStartDate', () => {
    it('should return correct start date for week timeframe', () => {
      const result = (analyticsService as any).getStartDate('week');
      const expected = new Date();
      expected.setDate(expected.getDate() - 7);
      
      expect(result.getTime()).toBeCloseTo(expected.getTime(), -3); // Within 1 second
    });

    it('should return correct start date for month timeframe', () => {
      const result = (analyticsService as any).getStartDate('month');
      const expected = new Date();
      expected.setMonth(expected.getMonth() - 1);
      
      expect(result.getTime()).toBeCloseTo(expected.getTime(), -3);
    });

    it('should return correct start date for year timeframe', () => {
      const result = (analyticsService as any).getStartDate('year');
      const expected = new Date();
      expected.setFullYear(expected.getFullYear() - 1);
      
      expect(result.getTime()).toBeCloseTo(expected.getTime(), -3);
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors in getLearningInsights', async () => {
      const error = new Error('Connection timeout');
      mockDb.select = vi.fn().mockRejectedValue(error);

      await expect(analyticsService.getLearningInsights('month'))
        .rejects.toThrow('Failed to generate learning insights');
    });

    it('should handle database connection errors in getStudentAnalytics', async () => {
      const error = new Error('Connection timeout');
      mockDb.select = vi.fn().mockRejectedValue(error);

      await expect(analyticsService.getStudentAnalytics(1))
        .rejects.toThrow('Failed to generate student analytics');
    });
  });
});
