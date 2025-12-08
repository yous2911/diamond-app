/**
 * Isolated Unit Tests for Analytics Service
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
            prenom: 'John',
            nom: 'Doe',
            totalPoints: _100,
            serieJours: 5,
            niveauActuel: 'CP'
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
  gte: vi.fn(),
  lte: vi.fn(),
  and: vi.fn(),
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
import { analyticsService } from '../services/analytics.service';
import { getDatabase } from '../db/connection';

describe('Analytics Service - Isolated Unit Tests', () => {
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = getDatabase();
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(analyticsService).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof analyticsService.getLearningInsights).toBe('function');
      expect(typeof analyticsService.getStudentAnalytics).toBe('function');
      expect(typeof analyticsService.updateDailyAnalytics).toBe('function');
      expect(typeof analyticsService.calculateCurrentStreak).toBe('function');
    });
  });

  describe('getLearningInsights Function', () => {
    it('should get learning insights for month timeframe', async () => {
      const result = await analyticsService.getLearningInsights('month');

      expect(result).toBeDefined();
      expect(result.timeframe).toBe('month');
      expect(result.totalStudents).toBeDefined();
      expect(result.activeStudents).toBeDefined();
      expect(result.completionRate).toBeDefined();
      expect(result.averageProgress).toBeDefined();
      expect(result.topPerformingStudents).toBeDefined();
      expect(result.learningTrends).toBeDefined();
    });

    it('should handle different timeframes', async () => {
      const timeframes = ['week', 'month', 'quarter', 'year'];
      
      for (const timeframe of timeframes) {
        const result = await analyticsService.getLearningInsights(timeframe as any);
        expect(result).toBeDefined();
        expect(result.timeframe).toBe(timeframe);
      }
    });

    it('should handle zero division in completion rate calculation', async () => {
      // Mock empty results
      mockDb.select().from().where().limit.mockResolvedValue([]);

      const result = await analyticsService.getLearningInsights('month');

      expect(result).toBeDefined();
      expect(result.completionRate).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      mockDb.select().from().where().limit.mockRejectedValue(new Error('Database error'));

      await expect(analyticsService.getLearningInsights('month'))
        .rejects.toThrow('Failed to generate learning insights');
    });
  });

  describe('getStudentAnalytics Function', () => {
    it('should get comprehensive student analytics', async () => {
      const result = await analyticsService.getStudentAnalytics(1);

      expect(result).toBeDefined();
      expect(result.studentId).toBe(1);
      expect(result.overallProgress).toBeDefined();
      expect(result.weeklyProgress).toBeDefined();
      expect(result.monthlyProgress).toBeDefined();
      expect(result.strongSubjects).toBeDefined();
      expect(result.weakSubjects).toBeDefined();
      expect(result.learningStreak).toBeDefined();
      expect(result.timeSpent).toBeDefined();
      expect(result.exercisesCompleted).toBeDefined();
      expect(result.accuracyRate).toBeDefined();
    });

    it('should throw error for non-existent student', async () => {
      // Mock empty result
      mockDb.select().from().where().limit.mockResolvedValue([]);

      await expect(analyticsService.getStudentAnalytics(999))
        .rejects.toThrow('Failed to generate student analytics');
    });

    it('should handle zero progress metrics', async () => {
      // Mock student with zero progress
      mockDb.select().from().where().limit.mockResolvedValue([{
        id: 1,
        prenom: 'John',
        nom: 'Doe',
        totalPoints: 0,
        serieJours: 0,
        niveauActuel: 'CP'
      }]);

      const result = await analyticsService.getStudentAnalytics(1);

      expect(result).toBeDefined();
      expect(result.overallProgress).toBe(0);
      expect(result.learningStreak).toBe(0);
    });
  });

  describe('updateDailyAnalytics Function', () => {
    it('should update daily analytics for student', async () => {
      const studentId = 1;
      const date = new Date('2024-01-15');

      await analyticsService.updateDailyAnalytics(studentId, date);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.insert().values).toHaveBeenCalledWith({
        studentId: 1,
        date: new Date('2024-01-15'),
        exercisesCompleted: expect.any(Number),
        timeSpent: expect.any(Number),
        accuracyRate: expect.any(Number),
        pointsEarned: expect.any(Number),
        levelProgress: expect.any(Number),
        streakDays: expect.any(Number)
      });
    });

    it('should handle null values in daily metrics', async () => {
      const studentId = 1;
      const date = new Date('2024-01-15');

      // Mock empty progress data
      mockDb.select().from().where().limit.mockResolvedValue([]);

      await analyticsService.updateDailyAnalytics(studentId, date);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.insert().values).toHaveBeenCalledWith({
        studentId: 1,
        date: new Date('2024-01-15'),
        exercisesCompleted: 0,
        timeSpent: 0,
        accuracyRate: 0,
        pointsEarned: 0,
        levelProgress: 0,
        streakDays: 0
      });
    });

    it('should handle database errors in daily analytics update', async () => {
      mockDb.insert().values.mockRejectedValue(new Error('Database error'));

      await expect(analyticsService.updateDailyAnalytics(1, new Date()))
        .rejects.toThrow('Failed to update daily analytics');
    });
  });

  describe('calculateCurrentStreak Function', () => {
    it('should calculate current streak correctly', async () => {
      // Mock consecutive daily activities
      mockDb.select().from().where().limit.mockResolvedValue([
        { date: new Date('2024-01-15'), exercisesCompleted: 5 },
        { date: new Date('2024-01-14'), exercisesCompleted: 3 },
        { date: new Date('2024-01-13'), exercisesCompleted: 4 }
      ]);

      const result = await (analyticsService as any).calculateCurrentStreak(1);

      expect(result).toBe(3); // Should count consecutive days from today
    });

    it('should return 0 for no recent activity', async () => {
      // Mock no recent activity
      mockDb.select().from().where().limit.mockResolvedValue([]);

      const result = await (analyticsService as any).calculateCurrentStreak(1);

      expect(result).toBe(0);
    });

    it('should handle errors in streak calculation', async () => {
      mockDb.select().from().where().limit.mockRejectedValue(new Error('Database error'));

      const result = await (analyticsService as any).calculateCurrentStreak(1);

      expect(result).toBe(0);
    });
  });

  describe('getStartDate Function', () => {
    it('should return correct start date for week', () => {
      const result = (analyticsService as any).getStartDate('week');
      const expected = new Date();
      expected.setDate(expected.getDate() - 7);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeCloseTo(expected.getTime(), -3); // Within 1 second
    });

    it('should return correct start date for month', () => {
      const result = (analyticsService as any).getStartDate('month');
      const expected = new Date();
      expected.setMonth(expected.getMonth() - 1);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeCloseTo(expected.getTime(), -3); // Within 1 second
    });

    it('should return correct start date for year', () => {
      const result = (analyticsService as any).getStartDate('year');
      const expected = new Date();
      expected.setFullYear(expected.getFullYear() - 1);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeCloseTo(expected.getTime(), -3); // Within 1 second
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors', async () => {
      mockDb.select().from().where().limit.mockRejectedValue(new Error('Connection failed'));

      await expect(analyticsService.getLearningInsights('month'))
        .rejects.toThrow('Failed to generate learning insights');
    });

    it('should handle invalid student ID', async () => {
      await expect(analyticsService.getStudentAnalytics(-1))
        .rejects.toThrow('Failed to generate student analytics');
    });
  });
});
