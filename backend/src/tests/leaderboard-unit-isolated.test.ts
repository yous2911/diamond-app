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
      expect(typeof leaderboardService.getLeaderboard).toBe('function');
      expect(typeof leaderboardService.updateAllLeaderboards).toBe('function');
      expect(typeof leaderboardService.updateBadges).toBe('function');
      expect(typeof leaderboardService.getStudentRank).toBe('function');
      expect(typeof leaderboardService.getUserCentricLeaderboard).toBe('function');
      expect(typeof leaderboardService.getNearbyCompetitors).toBe('function');
    });
  });

  describe('getLeaderboard Function', () => {
    it('should get leaderboard', async () => {
      const result = await leaderboardService.getLeaderboard('global', 'points', { limit: 10 });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('entries');
      expect(result).toHaveProperty('context');
      expect(Array.isArray(result.entries)).toBe(true);
      expect(result.entries.length).toBeLessThanOrEqual(10);
      
      if (result.entries.length > 0) {
        expect(result.entries[0]).toHaveProperty('studentId');
        expect(result.entries[0]).toHaveProperty('rank');
        expect(result.entries[0]).toHaveProperty('score');
        expect(result.entries[0]).toHaveProperty('student');
      }
    });

    it('should limit number of results', async () => {
      const result = await leaderboardService.getLeaderboard('global', 'points', { limit: 5 });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('entries');
      expect(Array.isArray(result.entries)).toBe(true);
      expect(result.entries.length).toBeLessThanOrEqual(5);
    });

    it('should handle empty leaderboard', async () => {
      // Mock empty result
      mockDb.select().from().where().orderBy().limit.mockResolvedValue([]);

      const result = await leaderboardService.getLeaderboard('global', 'points', { limit: 10 });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('entries');
      expect(Array.isArray(result.entries)).toBe(true);
      expect(result.entries.length).toBe(0);
    });
  });

  describe('updateAllLeaderboards Function', () => {
    it('should update all leaderboards', async () => {
      const result = await leaderboardService.updateAllLeaderboards();

      expect(result).toBeUndefined(); // void function
    });

    it('should handle database errors gracefully', async () => {
      mockDb.select().from().where().orderBy().limit.mockRejectedValue(new Error('Database error'));

      const result = await leaderboardService.updateAllLeaderboards();

      expect(result).toBeUndefined(); // Should not throw
    });
  });

  describe('updateBadges Function', () => {
    it('should update badges', async () => {
      const result = await leaderboardService.updateBadges();

      expect(result).toBeUndefined(); // void function
    });

    it('should handle database errors gracefully', async () => {
      mockDb.select().from().where().orderBy().limit.mockRejectedValue(new Error('Database error'));

      const result = await leaderboardService.updateBadges();

      expect(result).toBeUndefined(); // Should not throw
    });
  });

  describe('getStudentRank Function', () => {
    it('should get student rank', async () => {
      const result = await leaderboardService.getStudentRank(1, 'global', 'points');

      expect(result).toBeDefined();
      if (result) {
        expect(result).toHaveProperty('studentId');
        expect(result).toHaveProperty('rank');
        expect(result).toHaveProperty('score');
      }
    });

    it('should return null for non-existent student', async () => {
      // Mock empty result
      mockDb.select().from().where().orderBy().limit.mockResolvedValue([]);

      const result = await leaderboardService.getStudentRank(999, 'global', 'points');

      expect(result).toBeNull();
    });

    it('should handle different leaderboard types', async () => {
      const types = ['global', 'weekly', 'monthly'];
      
      for (const type of types) {
        const result = await leaderboardService.getStudentRank(1, type, 'points');
        expect(result).toBeDefined();
      }
    });
  });

  describe('getUserCentricLeaderboard Function', () => {
    it('should get user-centric leaderboard', async () => {
      const result = await leaderboardService.getUserCentricLeaderboard(1, 'global', 'points');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('entries');
      expect(result).toHaveProperty('context');
      expect(Array.isArray(result.entries)).toBe(true);
    });

    it('should include user context', async () => {
      const result = await leaderboardService.getUserCentricLeaderboard(1, 'global', 'points');

      expect(result).toBeDefined();
      expect(result.context).toBeDefined();
      expect(result.context).toHaveProperty('totalParticipants');
      expect(result.context).toHaveProperty('userRank');
    });

    it('should handle non-existent user', async () => {
      // Mock empty result
      mockDb.select().from().where().orderBy().limit.mockResolvedValue([]);

      const result = await leaderboardService.getUserCentricLeaderboard(999, 'global', 'points');

      expect(result).toBeDefined();
      expect(result.entries).toBeDefined();
      expect(Array.isArray(result.entries)).toBe(true);
    });
  });

  describe('getNearbyCompetitors Function', () => {
    it('should get nearby competitors', async () => {
      const result = await leaderboardService.getNearbyCompetitors(1, 'global', 'points', 5);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should limit competitor range', async () => {
      const result = await leaderboardService.getNearbyCompetitors(1, 'global', 'points', 3);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(7); // 3 above + 3 below + user = 7 max
    });

    it('should return empty array for non-existent student', async () => {
      // Mock empty result
      mockDb.select().from().where().orderBy().limit.mockResolvedValue([]);

      const result = await leaderboardService.getNearbyCompetitors(999, 'global', 'points', 5);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors', async () => {
      mockDb.select().from().where().orderBy().limit.mockRejectedValue(new Error('Connection failed'));

      const result = await leaderboardService.getLeaderboard('global', 'points', { limit: 10 });
      expect(result).toBeDefined();
      expect(result.entries).toBeDefined();
      expect(Array.isArray(result.entries)).toBe(true);
    });

    it('should handle invalid parameters gracefully', async () => {
      const result = await leaderboardService.getLeaderboard('invalid', 'invalid', { limit: -1 });
      expect(result).toBeDefined();
      expect(result.entries).toBeDefined();
      expect(Array.isArray(result.entries)).toBe(true);
    });
  });
});