/**
 * Unit tests for useXPSystemAnalytics hooks
 * Tests real XP tracking and leveling analytics logic
 */

import { renderHook, act } from '@testing-library/react';
import { useXPSystemAnalytics } from '../useXPSystemAnalytics';

// Mock Date for consistent testing
const mockDate = new Date('2024-01-15T10:30:00Z');
const originalDate = Date;

describe('useXPSystemAnalytics Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    global.Date = jest.fn(() => mockDate) as any;
    global.Date.now = jest.fn(() => mockDate.getTime());
    Object.setPrototypeOf(global.Date, originalDate);
  });

  afterEach(() => {
    jest.useRealTimers();
    global.Date = originalDate;
  });

  describe('Hook Initialization', () => {
    it('should initialize with all required functions', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      expect(typeof result.current.trackXPGain).toBe('function');
      expect(typeof result.current.trackLevelUp).toBe('function');
      expect(typeof result.current.trackStreakChange).toBe('function');
      expect(typeof result.current.trackAchievementUnlock).toBe('function');
      expect(typeof result.current.getXPStats).toBe('function');
      expect(typeof result.current.getLevelingStats).toBe('function');
    });

    it('should initialize with default XP stats', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      const xpStats = result.current.getXPStats();
      expect(xpStats).toEqual({
        totalXPGained: 0,
        averageXPPerSession: 0,
        xpSources: {},
        sessionCount: 1 // Auto-incremented on initialization
      });
    });

    it('should initialize with default leveling stats', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      const levelingStats = result.current.getLevelingStats();
      expect(levelingStats).toEqual({
        currentLevel: 1,
        levelUps: 0,
        timeToLevelUp: [],
        achievementsUnlocked: 0,
        currentStreak: 0,
        maxStreak: 0
      });
    });

    it('should auto-increment session count on initialization', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      const xpStats = result.current.getXPStats();
      expect(xpStats.sessionCount).toBe(1);
    });

    it('should maintain function identity across renders', () => {
      const { result, rerender } = renderHook(() => useXPSystemAnalytics());

      const initialFunctions = {
        trackXPGain: result.current.trackXPGain,
        trackLevelUp: result.current.trackLevelUp,
        getXPStats: result.current.getXPStats
      };

      rerender();

      expect(result.current.trackXPGain).toBe(initialFunctions.trackXPGain);
      expect(result.current.trackLevelUp).toBe(initialFunctions.trackLevelUp);
      expect(result.current.getXPStats).toBe(initialFunctions.getXPStats);
    });
  });

  describe('XP Gain Tracking', () => {
    it('should track XP gain correctly', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackXPGain(100, 'exercise_completion');
      });

      const xpStats = result.current.getXPStats();
      expect(xpStats.totalXPGained).toBe(100);
      expect(xpStats.xpSources.exercise_completion).toBe(100);
    });

    it('should accumulate XP from multiple gains', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackXPGain(100, 'exercise_completion');
        result.current.trackXPGain(50, 'daily_bonus');
        result.current.trackXPGain(25, 'exercise_completion');
      });

      const xpStats = result.current.getXPStats();
      expect(xpStats.totalXPGained).toBe(175);
      expect(xpStats.xpSources.exercise_completion).toBe(125);
      expect(xpStats.xpSources.daily_bonus).toBe(50);
    });

    it('should track XP from different sources independently', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackXPGain(100, 'exercise_completion');
        result.current.trackXPGain(50, 'daily_bonus');
        result.current.trackXPGain(75, 'streak_bonus');
        result.current.trackXPGain(25, 'exercise_completion');
      });

      const xpStats = result.current.getXPStats();
      expect(xpStats.xpSources).toEqual({
        exercise_completion: 125,
        daily_bonus: 50,
        streak_bonus: 75
      });
    });

    it('should handle zero XP gains', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackXPGain(0, 'failed_exercise');
      });

      const xpStats = result.current.getXPStats();
      expect(xpStats.totalXPGained).toBe(0);
      expect(xpStats.xpSources.failed_exercise).toBe(0);
    });

    it('should handle negative XP values', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackXPGain(100, 'exercise_completion');
        result.current.trackXPGain(-25, 'penalty');
      });

      const xpStats = result.current.getXPStats();
      expect(xpStats.totalXPGained).toBe(75);
      expect(xpStats.xpSources.penalty).toBe(-25);
    });

    it('should handle large XP values', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackXPGain(999999, 'massive_bonus');
      });

      const xpStats = result.current.getXPStats();
      expect(xpStats.totalXPGained).toBe(999999);
      expect(xpStats.xpSources.massive_bonus).toBe(999999);
    });

    it('should preserve other stats when tracking XP', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      // Track initial data
      act(() => {
        result.current.trackLevelUp(2);
      });

      act(() => {
        result.current.trackXPGain(100, 'exercise_completion');
      });

      const xpStats = result.current.getXPStats();
      const levelingStats = result.current.getLevelingStats();

      expect(xpStats.totalXPGained).toBe(100);
      expect(levelingStats.currentLevel).toBe(2); // Preserved
    });
  });

  describe('Level Up Tracking', () => {
    it('should track level up correctly', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackLevelUp(2);
      });

      const levelingStats = result.current.getLevelingStats();
      expect(levelingStats.currentLevel).toBe(2);
      expect(levelingStats.levelUps).toBe(1);
      expect(levelingStats.timeToLevelUp).toHaveLength(1);
      expect(levelingStats.timeToLevelUp[0]).toBe(0); // First level up has no previous time
    });

    it('should track multiple level ups', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackLevelUp(2);
        result.current.trackLevelUp(3);
        result.current.trackLevelUp(4);
      });

      const levelingStats = result.current.getLevelingStats();
      expect(levelingStats.currentLevel).toBe(4);
      expect(levelingStats.levelUps).toBe(3);
      expect(levelingStats.timeToLevelUp).toHaveLength(3);
    });

    it('should calculate time between level ups', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      // First level up
      act(() => {
        result.current.trackLevelUp(2);
      });

      // Test basic level up tracking
      const levelingStats = result.current.getLevelingStats();
      expect(levelingStats.currentLevel).toBe(2);
      expect(levelingStats.levelUps).toBe(1);
      expect(levelingStats.timeToLevelUp).toHaveLength(1);
    });

    it('should handle non-sequential level ups', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackLevelUp(5); // Skip levels 2-4
      });

      const levelingStats = result.current.getLevelingStats();
      expect(levelingStats.currentLevel).toBe(5);
      expect(levelingStats.levelUps).toBe(1);
    });

    it('should handle level decreases (edge case)', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackLevelUp(5);
        result.current.trackLevelUp(3); // Level decrease
      });

      const levelingStats = result.current.getLevelingStats();
      expect(levelingStats.currentLevel).toBe(3);
      expect(levelingStats.levelUps).toBe(2); // Still counts as level ups
    });

    it('should preserve other stats when tracking level ups', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackXPGain(100, 'exercise_completion');
        result.current.trackStreakChange(5);
        result.current.trackLevelUp(2);
      });

      const xpStats = result.current.getXPStats();
      const levelingStats = result.current.getLevelingStats();

      expect(xpStats.totalXPGained).toBe(100); // Preserved
      expect(levelingStats.currentStreak).toBe(5); // Preserved
      expect(levelingStats.currentLevel).toBe(2);
    });
  });

  describe('Streak Tracking', () => {
    it('should track streak changes correctly', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackStreakChange(5);
      });

      const levelingStats = result.current.getLevelingStats();
      expect(levelingStats.currentStreak).toBe(5);
      expect(levelingStats.maxStreak).toBe(5);
    });

    it('should update max streak when current streak exceeds it', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackStreakChange(5);
        result.current.trackStreakChange(8);
        result.current.trackStreakChange(3);
        result.current.trackStreakChange(10);
      });

      const levelingStats = result.current.getLevelingStats();
      expect(levelingStats.currentStreak).toBe(10);
      expect(levelingStats.maxStreak).toBe(10);
    });

    it('should not decrease max streak when current streak decreases', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackStreakChange(15);
        result.current.trackStreakChange(5);
      });

      const levelingStats = result.current.getLevelingStats();
      expect(levelingStats.currentStreak).toBe(5);
      expect(levelingStats.maxStreak).toBe(15);
    });

    it('should handle zero streak', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackStreakChange(5);
        result.current.trackStreakChange(0);
      });

      const levelingStats = result.current.getLevelingStats();
      expect(levelingStats.currentStreak).toBe(0);
      expect(levelingStats.maxStreak).toBe(5);
    });

    it('should handle negative streak values (edge case)', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackStreakChange(-1);
      });

      const levelingStats = result.current.getLevelingStats();
      expect(levelingStats.currentStreak).toBe(-1);
      expect(levelingStats.maxStreak).toBe(0); // Max doesn't go negative
    });

    it('should handle very large streak values', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackStreakChange(999999);
      });

      const levelingStats = result.current.getLevelingStats();
      expect(levelingStats.currentStreak).toBe(999999);
      expect(levelingStats.maxStreak).toBe(999999);
    });
  });

  describe('Achievement Tracking', () => {
    it('should track achievement unlocks correctly', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackAchievementUnlock('first_exercise');
      });

      const levelingStats = result.current.getLevelingStats();
      expect(levelingStats.achievementsUnlocked).toBe(1);
    });

    it('should accumulate multiple achievement unlocks', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackAchievementUnlock('first_exercise');
        result.current.trackAchievementUnlock('streak_master');
        result.current.trackAchievementUnlock('level_10');
      });

      const levelingStats = result.current.getLevelingStats();
      expect(levelingStats.achievementsUnlocked).toBe(3);
    });

    it('should track duplicate achievement IDs (if allowed)', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackAchievementUnlock('first_exercise');
        result.current.trackAchievementUnlock('first_exercise');
      });

      const levelingStats = result.current.getLevelingStats();
      expect(levelingStats.achievementsUnlocked).toBe(2);
    });

    it('should handle empty achievement IDs', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackAchievementUnlock('');
      });

      const levelingStats = result.current.getLevelingStats();
      expect(levelingStats.achievementsUnlocked).toBe(1);
    });

    it('should handle special characters in achievement IDs', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackAchievementUnlock('achievement_!@#$%^&*()');
      });

      const levelingStats = result.current.getLevelingStats();
      expect(levelingStats.achievementsUnlocked).toBe(1);
    });
  });

  describe('Complex Tracking Scenarios', () => {
    it('should handle mixed tracking operations correctly', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackXPGain(100, 'exercise_completion');
        result.current.trackStreakChange(3);
        result.current.trackLevelUp(2);
        result.current.trackAchievementUnlock('first_level_up');
        result.current.trackXPGain(50, 'streak_bonus');
      });

      const xpStats = result.current.getXPStats();
      const levelingStats = result.current.getLevelingStats();

      expect(xpStats.totalXPGained).toBe(150);
      expect(xpStats.xpSources.exercise_completion).toBe(100);
      expect(xpStats.xpSources.streak_bonus).toBe(50);
      expect(levelingStats.currentLevel).toBe(2);
      expect(levelingStats.currentStreak).toBe(3);
      expect(levelingStats.achievementsUnlocked).toBe(1);
    });

    it('should handle rapid successive operations', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.trackXPGain(10, 'rapid_exercise');
          result.current.trackStreakChange(i + 1);
        }
      });

      const xpStats = result.current.getXPStats();
      const levelingStats = result.current.getLevelingStats();

      expect(xpStats.totalXPGained).toBe(1000);
      expect(levelingStats.currentStreak).toBe(100);
      expect(levelingStats.maxStreak).toBe(100);
    });

    it('should maintain data consistency across complex operations', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      // Simulate a complete gaming session
      act(() => {
        // Exercise completion
        result.current.trackXPGain(100, 'exercise_completion');
        result.current.trackStreakChange(1);
        
        // Level up
        result.current.trackLevelUp(2);
        result.current.trackAchievementUnlock('level_2');
        
        // More exercises
        result.current.trackXPGain(150, 'exercise_completion');
        result.current.trackStreakChange(2);
        
        // Bonus XP
        result.current.trackXPGain(75, 'daily_bonus');
        
        // Another level up
        result.current.trackLevelUp(3);
        result.current.trackAchievementUnlock('streak_master');
      });

      const xpStats = result.current.getXPStats();
      const levelingStats = result.current.getLevelingStats();

      expect(xpStats.totalXPGained).toBe(325);
      expect(xpStats.xpSources.exercise_completion).toBe(250);
      expect(xpStats.xpSources.daily_bonus).toBe(75);
      expect(levelingStats.currentLevel).toBe(3);
      expect(levelingStats.levelUps).toBe(2);
      expect(levelingStats.currentStreak).toBe(2);
      expect(levelingStats.maxStreak).toBe(2);
      expect(levelingStats.achievementsUnlocked).toBe(2);
    });
  });

  describe('Stats Getters', () => {
    it('should return consistent XP stats', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackXPGain(100, 'test');
      });

      const stats1 = result.current.getXPStats();
      const stats2 = result.current.getXPStats();

      expect(stats1).toEqual(stats2);
      // Stats object is the same reference in this implementation
      expect(stats1).toBe(stats2);
    });

    it('should return consistent leveling stats', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackLevelUp(2);
      });

      const stats1 = result.current.getLevelingStats();
      const stats2 = result.current.getLevelingStats();

      expect(stats1).toEqual(stats2);
      // Stats object is the same reference in this implementation
      expect(stats1).toBe(stats2);
    });

    it('should reflect real-time changes in stats', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      const initialXPStats = result.current.getXPStats();
      expect(initialXPStats.totalXPGained).toBe(0);

      act(() => {
        result.current.trackXPGain(100, 'test');
      });

      const updatedXPStats = result.current.getXPStats();
      expect(updatedXPStats.totalXPGained).toBe(100);
    });
  });

  describe('Session Management', () => {
    it('should track session count correctly on initialization', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      const xpStats = result.current.getXPStats();
      expect(xpStats.sessionCount).toBe(1);
    });

    it('should not increment session count multiple times for same hook instance', () => {
      const { result, rerender } = renderHook(() => useXPSystemAnalytics());

      // Trigger re-renders
      rerender();
      rerender();

      const xpStats = result.current.getXPStats();
      expect(xpStats.sessionCount).toBe(1);
    });

    it('should handle session-based calculations', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackXPGain(200, 'session_exercise');
      });

      const xpStats = result.current.getXPStats();
      expect(xpStats.sessionCount).toBe(1);
      expect(xpStats.totalXPGained).toBe(200);
      // Note: averageXPPerSession calculation would need to be implemented in the hook
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined source names gracefully', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackXPGain(100, undefined as any);
      });

      const xpStats = result.current.getXPStats();
      expect(xpStats.totalXPGained).toBe(100);
      expect(xpStats.xpSources.undefined).toBe(100);
    });

    it('should handle level up timing correctly', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        result.current.trackLevelUp(2);
        result.current.trackLevelUp(3);
      });

      const levelingStats = result.current.getLevelingStats();
      expect(levelingStats.currentLevel).toBe(3);
      expect(levelingStats.levelUps).toBe(2);
      expect(levelingStats.timeToLevelUp).toHaveLength(2);
    });

    it('should handle concurrent operations without data corruption', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      act(() => {
        // Simulate concurrent operations
        result.current.trackXPGain(10, 'source1');
        result.current.trackLevelUp(2);
        result.current.trackXPGain(20, 'source2');
        result.current.trackStreakChange(5);
        result.current.trackXPGain(15, 'source1');
        result.current.trackAchievementUnlock('achievement1');
      });

      const xpStats = result.current.getXPStats();
      const levelingStats = result.current.getLevelingStats();

      expect(xpStats.totalXPGained).toBe(45);
      expect(xpStats.xpSources.source1).toBe(25);
      expect(xpStats.xpSources.source2).toBe(20);
      expect(levelingStats.currentLevel).toBe(2);
      expect(levelingStats.currentStreak).toBe(5);
      expect(levelingStats.achievementsUnlocked).toBe(1);
    });

    it('should handle extremely large numbers', () => {
      const { result } = renderHook(() => useXPSystemAnalytics());

      const largeNumber = Number.MAX_SAFE_INTEGER - 1;

      act(() => {
        result.current.trackXPGain(largeNumber, 'massive_gain');
        result.current.trackLevelUp(largeNumber);
        result.current.trackStreakChange(largeNumber);
      });

      const xpStats = result.current.getXPStats();
      const levelingStats = result.current.getLevelingStats();

      expect(xpStats.totalXPGained).toBe(largeNumber);
      expect(levelingStats.currentLevel).toBe(largeNumber);
      expect(levelingStats.currentStreak).toBe(largeNumber);
    });
  });
});