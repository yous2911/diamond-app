/**
 * Unit tests for Leaderboard Service
 * Tests rankings, competitions, badges, streaks, and gamification features
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LeaderboardService } from '../services/leaderboard.service';
import { db } from '../db/connection';
import { 
  leaderboards, leaderboardHistory, studentBadges, competitions,
  competitionParticipants, students, studentProgress, streaks
} from '../db/schema';
import { eq, and, desc, asc, sql, gte, lte, inArray } from 'drizzle-orm';

// Mock dependencies
vi.mock('../db/connection', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
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
  desc: vi.fn(),
  asc: vi.fn(),
  sql: vi.fn((template) => template),
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

describe('Leaderboard Service', () => {
  let leaderboardService: LeaderboardService;
  let mockDb: any;

  beforeEach(() => {
    leaderboardService = new LeaderboardService();
    mockDb = db as any;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getGlobalLeaderboard', () => {
    it('should return global leaderboard with rankings', async () => {
      const mockLeaderboardEntries = [
        {
          studentId: 1,
          rank: 1,
          score: 1000,
          previousRank: 2,
          rankChange: 1,
          student: {
            prenom: 'Alice',
            nom: 'Dupont',
            mascotteType: 'dragon',
            mascotteColor: '#ff6b35',
            niveauScolaire: 'CE2'
          },
          badges: [],
          streak: 5
        },
        {
          studentId: 2,
          rank: 2,
          score: 950,
          previousRank: 1,
          rankChange: -1,
          student: {
            prenom: 'Bob',
            nom: 'Martin',
            mascotteType: 'unicorn',
            mascotteColor: '#4ecdc4',
            niveauScolaire: 'CE2'
          },
          badges: [],
          streak: 3
        }
      ];

      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue(mockLeaderboardEntries)
                  })
                })
              })
            })
          })
        })
      });

      mockDb.select = mockSelect;

      const result = await leaderboardService.getGlobalLeaderboard(10);

      expect(result).toEqual(mockLeaderboardEntries);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should handle empty leaderboard', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([])
                  })
                })
              })
            })
          })
        })
      });

      mockDb.select = mockSelect;

      const result = await leaderboardService.getGlobalLeaderboard(10);

      expect(result).toEqual([]);
    });
  });

  describe('getClassLeaderboard', () => {
    it('should return class-specific leaderboard', async () => {
      const classId = 'CE2-A';
      const mockClassEntries = [
        {
          studentId: 1,
          rank: 1,
          score: 800,
          student: {
            prenom: 'Alice',
            nom: 'Dupont',
            mascotteType: 'dragon',
            mascotteColor: '#ff6b35',
            niveauScolaire: 'CE2'
          },
          badges: []
        }
      ];

      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue(mockClassEntries)
                  })
                })
              })
            })
          })
        })
      });

      mockDb.select = mockSelect;

      const result = await leaderboardService.getClassLeaderboard(classId, 10);

      expect(result).toEqual(mockClassEntries);
    });
  });

  describe('getStudentRank', () => {
    it('should return student rank in leaderboard', async () => {
      const studentId = 1;
      const mockRankData = [
        {
          rank: 5,
          score: 750,
          totalStudents: 100
        }
      ];

      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockRankData)
            })
          })
        })
      });

      mockDb.select = mockSelect;

      const result = await leaderboardService.getStudentRank(studentId);

      expect(result).toEqual({
        rank: 5,
        score: 750,
        percentile: 95, // (100-5)/100 * 100
        totalStudents: 100
      });
    });

    it('should return null for non-existent student', async () => {
      const studentId = 999;
      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([])
            })
          })
        })
      });

      mockDb.select = mockSelect;

      const result = await leaderboardService.getStudentRank(studentId);

      expect(result).toBeNull();
    });
  });

  describe('updateLeaderboard', () => {
    it('should update leaderboard with new scores', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { studentId: 1, totalPoints: 1000 },
              { studentId: 2, totalPoints: 950 }
            ])
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

      const result = await leaderboardService.updateLeaderboard();

      expect(result).toBe(true);
      expect(mockDb.insert).toHaveBeenCalledWith(leaderboards);
    });

    it('should handle update errors gracefully', async () => {
      const error = new Error('Database error');
      mockDb.select = vi.fn().mockRejectedValue(error);

      const result = await leaderboardService.updateLeaderboard();

      expect(result).toBe(false);
    });
  });

  describe('createCompetition', () => {
    it('should create new competition successfully', async () => {
      const competitionData = {
        name: 'Weekly Math Challenge',
        description: 'Solve math problems to win!',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-22'),
        rules: { minLevel: 'CE2', maxParticipants: 50 },
        prizes: [{ type: 'badge', name: 'Math Master' }]
      };

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1, ...competitionData }])
        })
      });

      mockDb.insert = mockInsert;

      const result = await leaderboardService.createCompetition(competitionData);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(mockDb.insert).toHaveBeenCalledWith(competitions);
    });

    it('should handle competition creation errors', async () => {
      const competitionData = {
        name: 'Test Competition',
        description: 'Test',
        startDate: new Date(),
        endDate: new Date(),
        rules: {},
        prizes: []
      };

      const error = new Error('Database error');
      mockDb.insert = vi.fn().mockRejectedValue(error);

      const result = await leaderboardService.createCompetition(competitionData);

      expect(result).toBeNull();
    });
  });

  describe('joinCompetition', () => {
    it('should allow student to join competition', async () => {
      const studentId = 1;
      const competitionId = 1;

      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ id: 1, maxParticipants: 50 }])
          })
        })
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined)
      });

      mockDb.select = mockSelect;
      mockDb.insert = mockInsert;

      const result = await leaderboardService.joinCompetition(studentId, competitionId);

      expect(result).toBe(true);
      expect(mockDb.insert).toHaveBeenCalledWith(competitionParticipants);
    });

    it('should prevent joining full competition', async () => {
      const studentId = 1;
      const competitionId = 1;

      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ id: 1, maxParticipants: 1 }])
          })
        })
      });

      mockDb.select = mockSelect;

      const result = await leaderboardService.joinCompetition(studentId, competitionId);

      expect(result).toBe(false);
    });
  });

  describe('awardBadge', () => {
    it('should award badge to student', async () => {
      const studentId = 1;
      const badgeData = {
        name: 'Math Master',
        description: 'Completed 100 math exercises',
        rarity: 'rare',
        icon: 'math-icon',
        category: 'achievement'
      };

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1, ...badgeData }])
        })
      });

      mockDb.insert = mockInsert;

      const result = await leaderboardService.awardBadge(studentId, badgeData);

      expect(result).toBeDefined();
      expect(result.name).toBe('Math Master');
      expect(mockDb.insert).toHaveBeenCalledWith(studentBadges);
    });

    it('should handle badge award errors', async () => {
      const studentId = 1;
      const badgeData = {
        name: 'Test Badge',
        description: 'Test',
        rarity: 'common',
        icon: 'test',
        category: 'test'
      };

      const error = new Error('Database error');
      mockDb.insert = vi.fn().mockRejectedValue(error);

      const result = await leaderboardService.awardBadge(studentId, badgeData);

      expect(result).toBeNull();
    });
  });

  describe('getStudentBadges', () => {
    it('should return student badges', async () => {
      const studentId = 1;
      const mockBadges = [
        {
          id: 1,
          name: 'Math Master',
          description: 'Completed 100 math exercises',
          rarity: 'rare',
          icon: 'math-icon',
          category: 'achievement',
          earnedAt: new Date()
        },
        {
          id: 2,
          name: 'Speed Demon',
          description: 'Completed exercise in under 30 seconds',
          rarity: 'epic',
          icon: 'speed-icon',
          category: 'performance',
          earnedAt: new Date()
        }
      ];

      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockBadges)
            })
          })
        })
      });

      mockDb.select = mockSelect;

      const result = await leaderboardService.getStudentBadges(studentId);

      expect(result).toEqual(mockBadges);
    });

    it('should return empty array for student with no badges', async () => {
      const studentId = 999;
      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([])
            })
          })
        })
      });

      mockDb.select = mockSelect;

      const result = await leaderboardService.getStudentBadges(studentId);

      expect(result).toEqual([]);
    });
  });

  describe('updateStreak', () => {
    it('should update student streak', async () => {
      const studentId = 1;
      const streakType = 'daily';
      const increment = 1;

      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ id: 1, currentStreak: 5 }])
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

      const result = await leaderboardService.updateStreak(studentId, streakType, increment);

      expect(result).toBe(true);
      expect(mockDb.update).toHaveBeenCalledWith(streaks);
    });

    it('should create new streak record if none exists', async () => {
      const studentId = 1;
      const streakType = 'daily';
      const increment = 1;

      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]) // No existing streak
          })
        })
      });

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined)
      });

      mockDb.select = mockSelect;
      mockDb.insert = mockInsert;

      const result = await leaderboardService.updateStreak(studentId, streakType, increment);

      expect(result).toBe(true);
      expect(mockDb.insert).toHaveBeenCalledWith(streaks);
    });
  });

  describe('getStreakLeaderboard', () => {
    it('should return streak-based leaderboard', async () => {
      const streakType = 'daily';
      const mockStreakEntries = [
        {
          studentId: 1,
          currentStreak: 15,
          longestStreak: 20,
          student: {
            prenom: 'Alice',
            nom: 'Dupont',
            mascotteType: 'dragon',
            mascotteColor: '#ff6b35'
          }
        },
        {
          studentId: 2,
          currentStreak: 12,
          longestStreak: 18,
          student: {
            prenom: 'Bob',
            nom: 'Martin',
            mascotteType: 'unicorn',
            mascotteColor: '#4ecdc4'
          }
        }
      ];

      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue(mockStreakEntries)
                })
              })
            })
          })
        })
      });

      mockDb.select = mockSelect;

      const result = await leaderboardService.getStreakLeaderboard(streakType, 10);

      expect(result).toEqual(mockStreakEntries);
    });
  });

  describe('getCompetitionLeaderboard', () => {
    it('should return competition-specific leaderboard', async () => {
      const competitionId = 1;
      const mockCompetitionEntries = [
        {
          studentId: 1,
          rank: 1,
          score: 500,
          student: {
            prenom: 'Alice',
            nom: 'Dupont',
            mascotteType: 'dragon',
            mascotteColor: '#ff6b35'
          }
        }
      ];

      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue(mockCompetitionEntries)
                  })
                })
              })
            })
          })
        })
      });

      mockDb.select = mockSelect;

      const result = await leaderboardService.getCompetitionLeaderboard(competitionId, 10);

      expect(result).toEqual(mockCompetitionEntries);
    });
  });

  describe('getLeaderboardHistory', () => {
    it('should return leaderboard history for student', async () => {
      const studentId = 1;
      const days = 30;
      const mockHistory = [
        {
          date: new Date('2024-01-15'),
          rank: 5,
          score: 750,
          rankChange: 2
        },
        {
          date: new Date('2024-01-14'),
          rank: 7,
          score: 720,
          rankChange: -1
        }
      ];

      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockHistory)
            })
          })
        })
      });

      mockDb.select = mockSelect;

      const result = await leaderboardService.getLeaderboardHistory(studentId, days);

      expect(result).toEqual(mockHistory);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully in all methods', async () => {
      const error = new Error('Database connection failed');
      mockDb.select = vi.fn().mockRejectedValue(error);
      mockDb.insert = vi.fn().mockRejectedValue(error);
      mockDb.update = vi.fn().mockRejectedValue(error);

      const results = await Promise.all([
        leaderboardService.getGlobalLeaderboard(10),
        leaderboardService.getClassLeaderboard('CE2-A', 10),
        leaderboardService.getStudentRank(1),
        leaderboardService.updateLeaderboard(),
        leaderboardService.createCompetition({
          name: 'Test',
          description: 'Test',
          startDate: new Date(),
          endDate: new Date(),
          rules: {},
          prizes: []
        }),
        leaderboardService.joinCompetition(1, 1),
        leaderboardService.awardBadge(1, {
          name: 'Test',
          description: 'Test',
          rarity: 'common',
          icon: 'test',
          category: 'test'
        }),
        leaderboardService.getStudentBadges(1),
        leaderboardService.updateStreak(1, 'daily', 1),
        leaderboardService.getStreakLeaderboard('daily', 10),
        leaderboardService.getCompetitionLeaderboard(1, 10),
        leaderboardService.getLeaderboardHistory(1, 30)
      ]);

      expect(results[0]).toEqual([]);
      expect(results[1]).toEqual([]);
      expect(results[2]).toBeNull();
      expect(results[3]).toBe(false);
      expect(results[4]).toBeNull();
      expect(results[5]).toBe(false);
      expect(results[6]).toBeNull();
      expect(results[7]).toEqual([]);
      expect(results[8]).toBe(false);
      expect(results[9]).toEqual([]);
      expect(results[10]).toEqual([]);
      expect(results[11]).toEqual([]);
    });
  });
});

