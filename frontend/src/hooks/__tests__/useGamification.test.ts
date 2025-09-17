/**
 * Unit tests for useGamification hooks
 * Tests individual hook functions with minimal external mocking
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  useGamificationProfile,
  useUserCentricLeaderboard,
  useXpProgression,
  useStreakManagement,
  useKudosSystem,
  useMotivationEngine,
  useAchievementStyling,
  useProgressAnimation
} from '../useGamification';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Mock useApiData for profile/leaderboard hooks
jest.mock('../useApiData', () => ({
  useApiData: jest.fn()
}));

import { useApiData } from '../useApiData';
const mockUseApiData = useApiData as jest.MockedFunction<typeof useApiData>;

describe('useGamification Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useGamificationProfile', () => {
    it('should call useApiData with correct parameters', () => {
      mockUseApiData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        lastFetch: null,
        refetch: jest.fn(),
        isFresh: false
      });

      renderHook(() => useGamificationProfile(123));

      expect(mockUseApiData).toHaveBeenCalledWith(
        expect.any(Function),
        { 
          cacheTime: 0.5,
          autoFetch: true
        }
      );
    });

    it('should not auto-fetch when userId is 0 or falsy', () => {
      mockUseApiData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        lastFetch: null,
        refetch: jest.fn(),
        isFresh: false
      });

      renderHook(() => useGamificationProfile(0));

      expect(mockUseApiData).toHaveBeenCalledWith(
        expect.any(Function),
        { 
          cacheTime: 0.5,
          autoFetch: false
        }
      );
    });

    it('should return profile data when available', () => {
      const mockProfileData = {
        xp: 1500,
        level: 5,
        nextLevelXp: 2000,
        xpToNext: 500,
        progressPercent: 75,
        streak: { current: 7, best: 15, lastActiveDate: '2024-01-15' },
        badges: [],
        rank: { position: 25, total: 100, percentile: 75, nearby: [], beatingCount: 75 }
      };

      mockUseApiData.mockReturnValue({
        data: mockProfileData,
        isLoading: false,
        error: null,
        lastFetch: new Date(),
        refetch: jest.fn(),
        isFresh: true
      });

      const { result } = renderHook(() => useGamificationProfile(123));

      expect(result.current.data).toEqual(mockProfileData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('useUserCentricLeaderboard', () => {
    it('should use correct default scope and cache settings', () => {
      mockUseApiData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        lastFetch: null,
        refetch: jest.fn(),
        isFresh: false
      });

      renderHook(() => useUserCentricLeaderboard(123));

      expect(mockUseApiData).toHaveBeenCalledWith(
        expect.any(Function),
        { 
          cacheTime: 0.25,
          autoFetch: true
        }
      );
    });

    it('should handle different scopes correctly', () => {
      mockUseApiData.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        lastFetch: null,
        refetch: jest.fn(),
        isFresh: false
      });

      const { rerender } = renderHook(
        ({ scope }) => useUserCentricLeaderboard(123, scope),
        { initialProps: { scope: 'friends' as const } }
      );

      // Test that it gets called with the fetch function
      expect(mockUseApiData).toHaveBeenCalled();

      rerender({ scope: 'all' as const });
      expect(mockUseApiData).toHaveBeenCalledTimes(2);
    });
  });

  describe('useXpProgression', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useXpProgression());

      expect(result.current.isAwarding).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.awardXp).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });

    it('should handle successful XP award', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            xpAwarded: 25,
            newXp: 1525,
            newLevel: 5,
            leveledUp: true,
            reason: 'exercise_complete'
          }
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useXpProgression());

      let awardResult;
      await act(async () => {
        awardResult = await result.current.awardXp(123, 25, 'exercise_complete');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/progress/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 123, delta: 25, reason: 'exercise_complete' })
      });

      expect(awardResult).toEqual({
        success: true,
        xpAwarded: 25,
        newXp: 1525,
        newLevel: 5,
        leveledUp: true,
        reason: 'exercise_complete',
        shouldCelebrate: true
      });

      expect(result.current.isAwarding).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle XP award failure', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: false,
          message: 'Invalid XP amount'
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useXpProgression());

      let awardResult;
      await act(async () => {
        awardResult = await result.current.awardXp(123, -10, 'exercise_complete');
      });

      expect(awardResult).toEqual({
        success: false,
        error: { message: 'Invalid XP amount' }
      });

      expect(result.current.error).toBe('Invalid XP amount');
      expect(result.current.isAwarding).toBe(false);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      const { result } = renderHook(() => useXpProgression());

      let awardResult;
      await act(async () => {
        awardResult = await result.current.awardXp(123, 25, 'login');
      });

      expect(awardResult).toEqual({
        success: false,
        error: { message: 'Network failure' }
      });

      expect(result.current.error).toBe('Network failure');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      const { result } = renderHook(() => useXpProgression());

      let awardResult;
      await act(async () => {
        awardResult = await result.current.awardXp(123, 25, 'achievement');
      });

      expect(awardResult).toEqual({
        success: false,
        error: { message: 'HTTP 400' }
      });
    });

    it('should clear errors correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: false,
          message: 'Test error'
        })
      });

      const { result } = renderHook(() => useXpProgression());

      await act(async () => {
        await result.current.awardXp(123, 25, 'login');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('useStreakManagement', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useStreakManagement());

      expect(result.current.isPinging).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.pingStreak).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });

    it('should handle successful streak ping with milestone', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            current: 8,
            best: 15,
            bonusAwarded: 10,
            milestone: true
          }
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useStreakManagement());

      let streakResult;
      await act(async () => {
        streakResult = await result.current.pingStreak(123);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/streak/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 123 })
      });

      expect(streakResult).toEqual({
        success: true,
        current: 8,
        best: 15,
        bonusAwarded: 10,
        milestone: true,
        shouldCelebrate: true
      });

      expect(result.current.isPinging).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle streak ping without milestone', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            current: 3,
            best: 15,
            bonusAwarded: 0,
            milestone: false
          }
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useStreakManagement());

      let streakResult;
      await act(async () => {
        streakResult = await result.current.pingStreak(123);
      });

      expect(streakResult).toEqual({
        success: true,
        current: 3,
        best: 15,
        bonusAwarded: 0,
        milestone: false,
        shouldCelebrate: false
      });
    });
  });

  describe('useKudosSystem', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useKudosSystem());

      expect(result.current.isGiving).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.giveKudos).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });

    it('should handle successful kudos giving', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: {
            kudosGiven: true,
            recipientNotified: true,
            cooldownSeconds: 300
          }
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useKudosSystem());

      let kudosResult;
      await act(async () => {
        kudosResult = await result.current.giveKudos(123, 456);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/kudos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUser: 123, toUser: 456 })
      });

      expect(kudosResult).toEqual({
        success: true,
        kudosGiven: true,
        recipientNotified: true,
        cooldownSeconds: 300
      });

      expect(result.current.isGiving).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle rate limiting errors', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: false,
          message: 'Kudos rate limit exceeded. Try again in 5 minutes.'
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useKudosSystem());

      let kudosResult;
      await act(async () => {
        kudosResult = await result.current.giveKudos(123, 456);
      });

      expect(kudosResult).toEqual({
        success: false,
        error: { message: 'Kudos rate limit exceeded. Try again in 5 minutes.' }
      });

      expect(result.current.error).toBe('Kudos rate limit exceeded. Try again in 5 minutes.');
    });
  });

  describe('useMotivationEngine', () => {
    it('should return default message when no data available', () => {
      const { result } = renderHook(() => useMotivationEngine(null, null));
      
      const message = result.current();
      expect(message).toBe("Commencez à jouer pour voir votre progression ! 🚀");
    });

    it('should return champion message for rank #1', () => {
      const profileData = {
        xp: 5000,
        level: 10,
        nextLevelXp: 6000,
        xpToNext: 1000,
        progressPercent: 83,
        streak: { current: 15, best: 20, lastActiveDate: '2024-01-15' },
        badges: [],
        rank: { position: 1, total: 100, percentile: 100, nearby: [], beatingCount: 99 }
      };

      const leaderboardData = {
        entries: [],
        context: { userRank: 1, totalParticipants: 100, percentile: 100, beatingCount: 99 }
      };

      const { result } = renderHook(() => useMotivationEngine(profileData, leaderboardData));
      
      const message = result.current();
      expect(message).toBe("🏆 Vous dominez le classement ! Maintenez votre avance !");
    });

    it('should return elite message for top 5%', () => {
      const profileData = {
        xp: 3000,
        level: 8,
        nextLevelXp: 4000,
        xpToNext: 1000,
        progressPercent: 75,
        streak: { current: 10, best: 15, lastActiveDate: '2024-01-15' },
        badges: [],
        rank: { position: 3, total: 100, percentile: 97, nearby: [], beatingCount: 97 }
      };

      const leaderboardData = {
        entries: [],
        context: { userRank: 3, totalParticipants: 100, percentile: 97, beatingCount: 97 }
      };

      const { result } = renderHook(() => useMotivationEngine(profileData, leaderboardData));
      
      const message = result.current();
      expect(message).toContain("⭐ Élite absolue !");
      expect(message).toContain("Top 3%");
      expect(message).toContain("97 joueurs");
    });

    it('should return high performer message for top 25%', () => {
      const profileData = {
        xp: 2000,
        level: 6,
        nextLevelXp: 3000,
        xpToNext: 1000,
        progressPercent: 67,
        streak: { current: 5, best: 10, lastActiveDate: '2024-01-15' },
        badges: [],
        rank: { position: 20, total: 100, percentile: 80, nearby: [], beatingCount: 80 }
      };

      const leaderboardData = {
        entries: [],
        context: { userRank: 20, totalParticipants: 100, percentile: 80, beatingCount: 80 }
      };

      const { result } = renderHook(() => useMotivationEngine(profileData, leaderboardData));
      
      const message = result.current();
      expect(message).toBe("🔥 Performance exceptionnelle ! Vous êtes dans le top 25% !");
    });

    it('should return next target message when available', () => {
      const profileData = {
        xp: 1000,
        level: 4,
        nextLevelXp: 2000,
        xpToNext: 1000,
        progressPercent: 50,
        streak: { current: 3, best: 8, lastActiveDate: '2024-01-15' },
        badges: [],
        rank: { position: 45, total: 100, percentile: 55, nearby: [], beatingCount: 55 }
      };

      const leaderboardData = {
        entries: [],
        context: { 
          userRank: 45, 
          totalParticipants: 100, 
          percentile: 55, 
          beatingCount: 55,
          nextTarget: { name: 'Alice', pointsNeeded: 75, rank: 44 }
        }
      };

      const { result } = renderHook(() => useMotivationEngine(profileData, leaderboardData));
      
      const message = result.current();
      expect(message).toBe("🎯 À seulement 75 points de battre Alice ! Vous pouvez le faire !");
    });

    it('should return positive reinforcement for others', () => {
      const profileData = {
        xp: 500,
        level: 2,
        nextLevelXp: 1000,
        xpToNext: 500,
        progressPercent: 50,
        streak: { current: 1, best: 3, lastActiveDate: '2024-01-15' },
        badges: [],
        rank: { position: 70, total: 100, percentile: 30, nearby: [], beatingCount: 30 }
      };

      const leaderboardData = {
        entries: [],
        context: { userRank: 70, totalParticipants: 100, percentile: 30, beatingCount: 30 }
      };

      const { result } = renderHook(() => useMotivationEngine(profileData, leaderboardData));
      
      const message = result.current();
      expect(message).toBe("💪 Continuez ! Vous battez 30 autres joueurs - montrez-leur de quoi vous êtes capable !");
    });
  });

  describe('useAchievementStyling', () => {
    it('should return correct styles for each rarity', () => {
      const { result } = renderHook(() => useAchievementStyling());

      const commonStyle = result.current('common');
      expect(commonStyle.bg).toBe('bg-gray-100 border-gray-300');
      expect(commonStyle.text).toBe('text-gray-800');
      expect(commonStyle.animation).toBe('');

      const rareStyle = result.current('rare');
      expect(rareStyle.bg).toBe('bg-blue-100 border-blue-400');
      expect(rareStyle.glow).toBe('shadow-blue-200 shadow-lg');

      const epicStyle = result.current('epic');
      expect(epicStyle.bg).toBe('bg-purple-100 border-purple-400');
      expect(epicStyle.animation).toBe('animate-pulse');

      const legendaryStyle = result.current('legendary');
      expect(legendaryStyle.bg).toBe('bg-gradient-to-r from-yellow-200 to-orange-200 border-yellow-400');
      expect(legendaryStyle.animation).toBe('animate-bounce');
    });

    it('should return consistent styles for same rarity', () => {
      const { result } = renderHook(() => useAchievementStyling());

      const style1 = result.current('epic');
      const style2 = result.current('epic');
      
      expect(style1).toEqual(style2);
    });
  });

  describe('useProgressAnimation', () => {
    it('should initialize with current XP', () => {
      const { result } = renderHook(() => useProgressAnimation(100, 150));

      expect(result.current.displayXp).toBe(100);
      expect(typeof result.current.animateToTarget).toBe('function');
    });

    it('should animate towards target XP', () => {
      const { result } = renderHook(() => useProgressAnimation(100, 150));

      act(() => {
        result.current.animateToTarget();
      });

      // Should move 10% of the way towards target
      expect(result.current.displayXp).toBe(105); // 100 + (150-100) * 0.1
    });

    it('should snap to target when difference is small', () => {
      const { result } = renderHook(() => useProgressAnimation(149.5, 150));

      act(() => {
        result.current.animateToTarget();
      });

      // Should snap to target when difference < 1 (0.5 < 1)
      expect(result.current.displayXp).toBe(150);
    });

    it('should snap to target when very close', () => {
      const { result } = renderHook(() => useProgressAnimation(149.9, 150));

      act(() => {
        result.current.animateToTarget();
      });

      // Should snap to target when difference < 1 (0.1 < 1)
      expect(result.current.displayXp).toBe(150);
    });

    it('should handle decreasing XP', () => {
      const { result } = renderHook(() => useProgressAnimation(100, 50));

      act(() => {
        result.current.animateToTarget();
      });

      // Should move 10% towards lower target
      expect(result.current.displayXp).toBe(95); // 100 + (50-100) * 0.1
    });
  });
});