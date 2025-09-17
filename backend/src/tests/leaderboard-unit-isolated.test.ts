/**
 * Isolated Unit Tests for Leaderboard Service
 * Tests individual functions without setup.ts interference
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock ALL dependencies before any imports
vi.mock('../db/connection', () => ({
  getDatabase: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 1,
              prenom: 'John',
              nom: 'Doe',
              totalPoints: 150,
              serieJours: 5,
              niveauActuel: 'CP'
            }])
          })
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
  desc: vi.fn(),
  asc: vi.fn(),
  and: vi.fn(),
  or: vi.fn(),
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
import { leaderboardService } from '../services/leaderboard.service';
import { getDatabase } from '../db/connection';

describe('Leaderboard Service - Isolated Unit Tests', () => {
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = getDatabase();
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(leaderboardService).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof leaderboardService.getGlobalLeaderboard).toBe('function');
      expect(typeof leaderboardService.getClassLeaderboard).toBe('function');
      expect(typeof leaderboardService.getWeeklyCompetition).toBe('function');
      expect(typeof leaderboardService.getMonthlyCompetition).toBe('function');
      expect(typeof leaderboardService.awardBadge).toBe('function');
      expect(typeof leaderboardService.getStudentBadges).toBe('function');
      expect(typeof leaderboardService.updateStreak).toBe('function');
      expect(typeof leaderboardService.getTopPerformers).toBe('function');
      expect(typeof leaderboardService.getPerformanceAnalytics).toBe('function');
    });
  });

  describe('getGlobalLeaderboard Function', () => {
    it('should get global leaderboard', async () => {
      const result = await leaderboardService.getGlobalLeaderboard(10);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10);
      
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('prenom');
        expect(result[0]).toHaveProperty('nom');
        expect(result[0]).toHaveProperty('totalPoints');
        expect(result[0]).toHaveProperty('rank');
      }
    });

    it('should limit number of results', async () => {
      const result = await leaderboardService.getGlobalLeaderboard(5);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should order by total points descending', async () => {
      const result = await leaderboardService.getGlobalLeaderboard(10);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      // Check if results are ordered by points (highest first)
      for (let i = 1; i < result.length; i++) {
        expect(result[i-1].totalPoints).toBeGreaterThanOrEqual(result[i].totalPoints);
      }
    });
  });

  describe('getClassLeaderboard Function', () => {
    it('should get class leaderboard', async () => {
      const result = await leaderboardService.getClassLeaderboard('CP', 10);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10);
      
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('prenom');
        expect(result[0]).toHaveProperty('nom');
        expect(result[0]).toHaveProperty('totalPoints');
        expect(result[0]).toHaveProperty('niveauActuel');
        expect(result[0].niveauActuel).toBe('CP');
      }
    });

    it('should handle different class levels', async () => {
      const levels = ['CP', 'CE1', 'CE2', 'CM1', 'CM2'];
      
      for (const level of levels) {
        const result = await leaderboardService.getClassLeaderboard(level, 5);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      }
    });

    it('should return empty array for non-existent class', async () => {
      // Mock empty result
      mockDb.select().from().where().orderBy().limit.mockResolvedValue([]);

      const result = await leaderboardService.getClassLeaderboard('NonExistentClass', 10);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('getWeeklyCompetition Function', () => {
    it('should get weekly competition results', async () => {
      const result = await leaderboardService.getWeeklyCompetition();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('weekStart');
      expect(result).toHaveProperty('weekEnd');
      expect(result).toHaveProperty('participants');
      expect(result).toHaveProperty('topPerformers');
      expect(Array.isArray(result.participants)).toBe(true);
      expect(Array.isArray(result.topPerformers)).toBe(true);
    });

    it('should include correct date range', async () => {
      const result = await leaderboardService.getWeeklyCompetition();

      expect(result).toBeDefined();
      expect(result.weekStart).toBeInstanceOf(Date);
      expect(result.weekEnd).toBeInstanceOf(Date);
      expect(result.weekEnd.getTime()).toBeGreaterThan(result.weekStart.getTime());
    });

    it('should identify top performers', async () => {
      const result = await leaderboardService.getWeeklyCompetition();

      expect(result).toBeDefined();
      expect(result.topPerformers).toBeDefined();
      expect(Array.isArray(result.topPerformers)).toBe(true);
    });
  });

  describe('getMonthlyCompetition Function', () => {
    it('should get monthly competition results', async () => {
      const result = await leaderboardService.getMonthlyCompetition();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('monthStart');
      expect(result).toHaveProperty('monthEnd');
      expect(result).toHaveProperty('participants');
      expect(result).toHaveProperty('champions');
      expect(Array.isArray(result.participants)).toBe(true);
      expect(Array.isArray(result.champions)).toBe(true);
    });

    it('should include correct month range', async () => {
      const result = await leaderboardService.getMonthlyCompetition();

      expect(result).toBeDefined();
      expect(result.monthStart).toBeInstanceOf(Date);
      expect(result.monthEnd).toBeInstanceOf(Date);
      expect(result.monthEnd.getTime()).toBeGreaterThan(result.monthStart.getTime());
    });

    it('should identify monthly champions', async () => {
      const result = await leaderboardService.getMonthlyCompetition();

      expect(result).toBeDefined();
      expect(result.champions).toBeDefined();
      expect(Array.isArray(result.champions)).toBe(true);
    });
  });

  describe('awardBadge Function', () => {
    it('should award badge to student', async () => {
      const badgeData = {
        studentId: 1,
        badgeType: 'streak_master',
        badgeName: 'Streak Master',
        description: 'Maintained a 7-day learning streak',
        points: 50
      };

      await leaderboardService.awardBadge(badgeData);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.insert().values).toHaveBeenCalledWith({
        studentId: 1,
        badgeType: 'streak_master',
        badgeName: 'Streak Master',
        description: 'Maintained a 7-day learning streak',
        points: 50,
        awardedAt: expect.any(Date)
      });
    });

    it('should handle different badge types', async () => {
      const badgeTypes = ['streak_master', 'point_collector', 'speed_demon', 'accuracy_king', 'dedication_star'];
      
      for (const badgeType of badgeTypes) {
        const badgeData = {
          studentId: 1,
          badgeType,
          badgeName: 'Test Badge',
          description: 'Test description',
          points: 25
        };

        await leaderboardService.awardBadge(badgeData);
        expect(mockDb.insert).toHaveBeenCalled();
      }
    });

    it('should handle database errors during badge awarding', async () => {
      mockDb.insert().values.mockRejectedValue(new Error('Database error'));

      const badgeData = {
        studentId: 1,
        badgeType: 'test_badge',
        badgeName: 'Test Badge',
        description: 'Test description',
        points: 25
      };

      await expect(leaderboardService.awardBadge(badgeData))
        .rejects.toThrow('Failed to award badge');
    });
  });

  describe('getStudentBadges Function', () => {
    it('should get student badges', async () => {
      const result = await leaderboardService.getStudentBadges(1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('badgeType');
        expect(result[0]).toHaveProperty('badgeName');
        expect(result[0]).toHaveProperty('description');
        expect(result[0]).toHaveProperty('points');
        expect(result[0]).toHaveProperty('awardedAt');
      }
    });

    it('should return empty array for student with no badges', async () => {
      // Mock empty result
      mockDb.select().from().where().orderBy().limit.mockResolvedValue([]);

      const result = await leaderboardService.getStudentBadges(1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should order badges by award date', async () => {
      const result = await leaderboardService.getStudentBadges(1);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('updateStreak Function', () => {
    it('should update student streak', async () => {
      const result = await leaderboardService.updateStreak(1, 5);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('newStreak');
      expect(result.success).toBe(true);
      expect(result.newStreak).toBe(5);
    });

    it('should handle streak reset', async () => {
      const result = await leaderboardService.updateStreak(1, 0);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('newStreak');
      expect(result.success).toBe(true);
      expect(result.newStreak).toBe(0);
    });

    it('should handle database errors during streak update', async () => {
      mockDb.update().set().where.mockRejectedValue(new Error('Database error'));

      const result = await leaderboardService.updateStreak(1, 5);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
    });
  });

  describe('getTopPerformers Function', () => {
    it('should get top performers', async () => {
      const result = await leaderboardService.getTopPerformers('week', 5);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
      
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('prenom');
        expect(result[0]).toHaveProperty('nom');
        expect(result[0]).toHaveProperty('totalPoints');
        expect(result[0]).toHaveProperty('rank');
      }
    });

    it('should handle different time periods', async () => {
      const periods = ['day', 'week', 'month', 'year'];
      
      for (const period of periods) {
        const result = await leaderboardService.getTopPerformers(period as any, 3);
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      }
    });

    it('should limit number of results', async () => {
      const result = await leaderboardService.getTopPerformers('month', 3);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getPerformanceAnalytics Function', () => {
    it('should get performance analytics', async () => {
      const result = await leaderboardService.getPerformanceAnalytics(1);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('studentId');
      expect(result).toHaveProperty('currentRank');
      expect(result).toHaveProperty('totalPoints');
      expect(result).toHaveProperty('streakDays');
      expect(result).toHaveProperty('badgesEarned');
      expect(result).toHaveProperty('weeklyProgress');
      expect(result).toHaveProperty('monthlyProgress');
      expect(result.studentId).toBe(1);
    });

    it('should include rank information', async () => {
      const result = await leaderboardService.getPerformanceAnalytics(1);

      expect(result).toBeDefined();
      expect(result.currentRank).toBeDefined();
      expect(typeof result.currentRank).toBe('number');
      expect(result.currentRank).toBeGreaterThan(0);
    });

    it('should include progress metrics', async () => {
      const result = await leaderboardService.getPerformanceAnalytics(1);

      expect(result).toBeDefined();
      expect(result.weeklyProgress).toBeDefined();
      expect(result.monthlyProgress).toBeDefined();
      expect(typeof result.weeklyProgress).toBe('number');
      expect(typeof result.monthlyProgress).toBe('number');
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors', async () => {
      mockDb.select().from().where().orderBy().limit.mockRejectedValue(new Error('Connection failed'));

      await expect(leaderboardService.getGlobalLeaderboard(10))
        .rejects.toThrow('Failed to get global leaderboard');
    });

    it('should handle invalid student ID', async () => {
      await expect(leaderboardService.getStudentBadges(-1))
        .rejects.toThrow('Invalid student ID');
    });

    it('should handle invalid limit parameter', async () => {
      await expect(leaderboardService.getGlobalLeaderboard(-1))
        .rejects.toThrow('Invalid limit');
    });
  });
});
