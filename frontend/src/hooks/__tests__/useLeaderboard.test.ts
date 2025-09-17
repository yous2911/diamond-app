/**
 * Unit tests for useLeaderboard hooks
 * Tests real leaderboard logic and utility functions
 */

import { renderHook } from '@testing-library/react';
import {
  useUserCentricLeaderboard,
  useStudentBadges,
  useLeaderboardStats,
  useCompetitions,
  useMotivationMessage,
  useBadgeStyle,
  useRankChangeIcon
} from '../useLeaderboard';

// Mock useApiData
jest.mock('../useApiData', () => ({
  useApiData: jest.fn()
}));

import { useApiData } from '../useApiData';
const mockUseApiData = useApiData as jest.MockedFunction<typeof useApiData>;

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('useLeaderboard Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApiData.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      lastFetch: null,
      refetch: jest.fn(),
      isFresh: false
    });
  });

  describe('useUserCentricLeaderboard', () => {
    it('should call useApiData with correct parameters for default values', () => {
      renderHook(() => useUserCentricLeaderboard(123));

      expect(mockUseApiData).toHaveBeenCalledWith(
        expect.any(Function),
        {
          cacheTime: 2,
          autoFetch: true
        }
      );
    });

    it('should not auto-fetch when studentId is 0', () => {
      renderHook(() => useUserCentricLeaderboard(0));

      expect(mockUseApiData).toHaveBeenCalledWith(
        expect.any(Function),
        {
          cacheTime: 2,
          autoFetch: false
        }
      );
    });

    it('should pass through all parameters correctly', () => {
      renderHook(() => useUserCentricLeaderboard(456, 'weekly', 'streak', 5));

      expect(mockUseApiData).toHaveBeenCalledWith(
        expect.any(Function),
        {
          cacheTime: 2,
          autoFetch: true
        }
      );

      // Test that the API function would be called with correct params
      const apiFunction = mockUseApiData.mock.calls[0][0];
      expect(typeof apiFunction).toBe('function');
    });

    it('should handle different leaderboard types', () => {
      const types = ['global', 'class', 'weekly', 'monthly'] as const;
      
      types.forEach(type => {
        mockUseApiData.mockClear();
        renderHook(() => useUserCentricLeaderboard(123, type));
        expect(mockUseApiData).toHaveBeenCalled();
      });
    });

    it('should handle different categories', () => {
      const categories = ['points', 'streak', 'exercises', 'accuracy'] as const;
      
      categories.forEach(category => {
        mockUseApiData.mockClear();
        renderHook(() => useUserCentricLeaderboard(123, 'global', category));
        expect(mockUseApiData).toHaveBeenCalled();
      });
    });
  });

  describe('useStudentBadges', () => {
    it('should call useApiData with correct cache settings', () => {
      renderHook(() => useStudentBadges(123));

      expect(mockUseApiData).toHaveBeenCalledWith(
        expect.any(Function),
        {
          cacheTime: 10,
          autoFetch: true
        }
      );
    });

    it('should not auto-fetch when studentId is falsy', () => {
      renderHook(() => useStudentBadges(0));

      expect(mockUseApiData).toHaveBeenCalledWith(
        expect.any(Function),
        {
          cacheTime: 10,
          autoFetch: false
        }
      );
    });
  });

  describe('useLeaderboardStats', () => {
    it('should call useApiData with correct cache settings', () => {
      renderHook(() => useLeaderboardStats());

      expect(mockUseApiData).toHaveBeenCalledWith(
        expect.any(Function),
        {
          cacheTime: 5
        }
      );
    });
  });

  describe('useCompetitions', () => {
    it('should call useApiData with correct cache settings', () => {
      renderHook(() => useCompetitions());

      expect(mockUseApiData).toHaveBeenCalledWith(
        expect.any(Function),
        {
          cacheTime: 15
        }
      );
    });
  });

  describe('useMotivationMessage', () => {
    it('should return default message when no data provided', () => {
      const { result } = renderHook(() => useMotivationMessage(null));
      
      const message = result.current();
      expect(message).toBe("Commencez à jouer pour apparaître dans le classement ! 🚀");
    });

    it('should return default message when no user entry', () => {
      const mockData = {
        userEntry: null,
        competitors: [],
        context: {
          totalParticipants: 100,
          userRank: 0,
          percentile: 0,
          beatingCount: 0
        }
      };

      const { result } = renderHook(() => useMotivationMessage(mockData));
      
      const message = result.current();
      expect(message).toBe("Commencez à jouer pour apparaître dans le classement ! 🚀");
    });

    it('should return champion message for rank 1', () => {
      const mockData = {
        userEntry: {
          studentId: 123,
          rank: 1,
          score: 1000,
          rankChange: 0,
          student: {
            prenom: 'Alice',
            nom: 'Dupont',
            mascotteType: 'dragon',
            mascotteColor: 'blue',
            niveauScolaire: 'CE2'
          },
          badges: []
        },
        competitors: [],
        context: {
          totalParticipants: 100,
          userRank: 1,
          percentile: 100,
          beatingCount: 99
        }
      };

      const { result } = renderHook(() => useMotivationMessage(mockData));
      
      const message = result.current();
      expect(message).toBe("🏆 Vous êtes le champion ! Continuez comme ça !");
    });

    it('should return top percentile message for 90th+ percentile', () => {
      const mockData = {
        userEntry: {
          studentId: 123,
          rank: 5,
          score: 800,
          rankChange: 2,
          student: {
            prenom: 'Bob',
            nom: 'Martin',
            mascotteType: 'cat',
            mascotteColor: 'orange',
            niveauScolaire: 'CE2'
          },
          badges: []
        },
        competitors: [],
        context: {
          totalParticipants: 100,
          userRank: 5,
          percentile: 95,
          beatingCount: 95
        }
      };

      const { result } = renderHook(() => useMotivationMessage(mockData));
      
      const message = result.current();
      expect(message).toContain("⭐ Top 5%");
      expect(message).toContain("95 autres joueurs");
    });

    it('should return excellent performance message for top 25%', () => {
      const mockData = {
        userEntry: {
          studentId: 123,
          rank: 20,
          score: 600,
          rankChange: -1,
          student: {
            prenom: 'Charlie',
            nom: 'Brown',
            mascotteType: 'owl',
            mascotteColor: 'brown',
            niveauScolaire: 'CE2'
          },
          badges: []
        },
        competitors: [],
        context: {
          totalParticipants: 100,
          userRank: 20,
          percentile: 80,
          beatingCount: 80
        }
      };

      const { result } = renderHook(() => useMotivationMessage(mockData));
      
      const message = result.current();
      expect(message).toBe("🔥 Excellente performance ! Vous êtes dans le top 25% !");
    });

    it('should return next target message when target exists', () => {
      const nextTarget = {
        studentId: 456,
        rank: 25,
        score: 550,
        rankChange: 0,
        student: {
          prenom: 'Emma',
          nom: 'Wilson',
          mascotteType: 'fairy',
          mascotteColor: 'pink',
          niveauScolaire: 'CE2'
        },
        badges: []
      };

      const mockData = {
        userEntry: {
          studentId: 123,
          rank: 26,
          score: 500,
          rankChange: 1,
          student: {
            prenom: 'David',
            nom: 'Jones',
            mascotteType: 'robot',
            mascotteColor: 'silver',
            niveauScolaire: 'CE2'
          },
          badges: []
        },
        competitors: [],
        context: {
          totalParticipants: 100,
          userRank: 26,
          percentile: 74,
          beatingCount: 74,
          nextTarget
        }
      };

      const { result } = renderHook(() => useMotivationMessage(mockData));
      
      const message = result.current();
      expect(message).toBe("🎯 À seulement 50 points de battre Emma !");
    });

    it('should return encouragement message for others', () => {
      const mockData = {
        userEntry: {
          studentId: 123,
          rank: 50,
          score: 300,
          rankChange: 0,
          student: {
            prenom: 'Frank',
            nom: 'Miller',
            mascotteType: 'dragon',
            mascotteColor: 'green',
            niveauScolaire: 'CE2'
          },
          badges: []
        },
        competitors: [],
        context: {
          totalParticipants: 100,
          userRank: 50,
          percentile: 50,
          beatingCount: 50
        }
      };

      const { result } = renderHook(() => useMotivationMessage(mockData));
      
      const message = result.current();
      expect(message).toBe("💪 Continuez ! Vous battez 50 autres joueurs !");
    });
  });

  describe('useBadgeStyle', () => {
    it('should return correct styles for each rarity', () => {
      const { result } = renderHook(() => useBadgeStyle());

      const commonStyle = result.current('common');
      expect(commonStyle).toEqual({
        bg: 'bg-gray-100',
        border: 'border-gray-300',
        text: 'text-gray-700',
        glow: 'shadow-sm'
      });

      const rareStyle = result.current('rare');
      expect(rareStyle).toEqual({
        bg: 'bg-blue-100',
        border: 'border-blue-400',
        text: 'text-blue-800',
        glow: 'shadow-blue-200 shadow-lg'
      });

      const epicStyle = result.current('epic');
      expect(epicStyle).toEqual({
        bg: 'bg-purple-100',
        border: 'border-purple-400',
        text: 'text-purple-800',
        glow: 'shadow-purple-300 shadow-xl'
      });

      const legendaryStyle = result.current('legendary');
      expect(legendaryStyle).toEqual({
        bg: 'bg-gradient-to-r from-yellow-200 to-orange-200',
        border: 'border-yellow-400',
        text: 'text-yellow-900',
        glow: 'shadow-yellow-300 shadow-2xl animate-pulse'
      });
    });

    it('should return common style for unknown rarity', () => {
      const { result } = renderHook(() => useBadgeStyle());

      const unknownStyle = result.current('unknown' as any);
      expect(unknownStyle).toEqual({
        bg: 'bg-gray-100',
        border: 'border-gray-300',
        text: 'text-gray-700',
        glow: 'shadow-sm'
      });
    });

    it('should return consistent styles for same rarity', () => {
      const { result } = renderHook(() => useBadgeStyle());

      const style1 = result.current('epic');
      const style2 = result.current('epic');
      
      expect(style1).toEqual(style2);
    });
  });

  describe('useRankChangeIcon', () => {
    it('should return up arrow for positive rank change', () => {
      const { result } = renderHook(() => useRankChangeIcon());

      const upIcon = result.current(5);
      expect(upIcon).toEqual({
        icon: '⬆️',
        color: 'text-green-600',
        bg: 'bg-green-100'
      });
    });

    it('should return down arrow for negative rank change', () => {
      const { result } = renderHook(() => useRankChangeIcon());

      const downIcon = result.current(-3);
      expect(downIcon).toEqual({
        icon: '⬇️',
        color: 'text-red-600',
        bg: 'bg-red-100'
      });
    });

    it('should return neutral icon for zero rank change', () => {
      const { result } = renderHook(() => useRankChangeIcon());

      const neutralIcon = result.current(0);
      expect(neutralIcon).toEqual({
        icon: '➖',
        color: 'text-gray-500',
        bg: 'bg-gray-100'
      });
    });

    it('should handle large positive changes', () => {
      const { result } = renderHook(() => useRankChangeIcon());

      const largeUp = result.current(50);
      expect(largeUp.icon).toBe('⬆️');
      expect(largeUp.color).toBe('text-green-600');
    });

    it('should handle large negative changes', () => {
      const { result } = renderHook(() => useRankChangeIcon());

      const largeDown = result.current(-25);
      expect(largeDown.icon).toBe('⬇️');
      expect(largeDown.color).toBe('text-red-600');
    });

    it('should return consistent results for same input', () => {
      const { result } = renderHook(() => useRankChangeIcon());

      const result1 = result.current(10);
      const result2 = result.current(10);
      
      expect(result1).toEqual(result2);
    });
  });

  describe('API Function Integration', () => {
    it('should construct correct URL parameters for user-centric leaderboard', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: { userEntry: null, competitors: [], context: {} }
        })
      });

      renderHook(() => useUserCentricLeaderboard(123, 'weekly', 'streak', 5));

      // Get the API function and call it to test URL construction
      const apiFunction = mockUseApiData.mock.calls[0][0];
      await apiFunction();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/leaderboards/user-centric/123')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('type=weekly')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('category=streak')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('range=5')
      );
    });

    it('should handle API errors correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValue('Not found')
      });

      renderHook(() => useStudentBadges(123));

      const apiFunction = mockUseApiData.mock.calls[0][0];
      
      await expect(apiFunction()).rejects.toThrow('HTTP 404: Not found');
    });

    it('should handle successful API responses', async () => {
      const mockBadges = [
        {
          id: 1,
          badgeType: 'streak',
          title: 'Streak Master',
          description: '7 day streak',
          rarity: 'rare' as const,
          earnedAt: new Date()
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          data: mockBadges
        })
      });

      renderHook(() => useStudentBadges(456));

      const apiFunction = mockUseApiData.mock.calls[0][0];
      const result = await apiFunction();

      expect(result).toEqual({
        success: true,
        data: mockBadges,
        error: undefined
      });
    });
  });
});