/**
 * Custom hooks for leaderboard data management
 * Integrates with existing useApiData pattern for consistency
 */

import { useCallback } from 'react';
import { useApiData } from './useApiData';

// Types
interface LeaderboardEntry {
  studentId: number;
  rank: number;
  score: number;
  previousRank?: number;
  rankChange: number;
  student: {
    prenom: string;
    nom: string;
    mascotteType: string;
    mascotteColor: string;
    niveauScolaire: string;
  };
  badges: any[];
  streak?: number;
  metadata?: any;
}

interface UserCentricLeaderboard {
  userEntry: LeaderboardEntry | null;
  competitors: LeaderboardEntry[];
  context: {
    totalParticipants: number;
    userRank: number;
    percentile: number;
    beatingCount: number;
    nextTarget?: LeaderboardEntry;
  };
}

interface Badge {
  id: number;
  badgeType: string;
  title: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: Date;
}

// API service functions
const leaderboardApi = {
  getUserCentricLeaderboard: async (
    studentId: number, 
    type: 'global' | 'class' | 'weekly' | 'monthly' = 'global',
    category: 'points' | 'streak' | 'exercises' | 'accuracy' = 'points',
    range: number = 3
  ) => {
    const params = new URLSearchParams({
      type,
      category,
      range: range.toString()
    });
    
    const response = await fetch(`/api/leaderboards/user-centric/${studentId}?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const result = await response.json();
    return { 
      success: result.success, 
      data: result.data as UserCentricLeaderboard,
      error: result.success ? undefined : { message: result.message } 
    };
  },

  getStudentBadges: async (studentId: number) => {
    const response = await fetch(`/api/badges/student/${studentId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const result = await response.json();
    return { 
      success: result.success, 
      data: result.data as Badge[],
      error: result.success ? undefined : { message: result.message } 
    };
  },

  getLeaderboardStats: async () => {
    const response = await fetch('/api/leaderboards/stats');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const result = await response.json();
    return { 
      success: result.success, 
      data: result.data,
      error: result.success ? undefined : { message: result.message } 
    };
  },

  getCompetitions: async () => {
    const response = await fetch('/api/competitions');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const result = await response.json();
    return { 
      success: result.success, 
      data: result.data,
      error: result.success ? undefined : { message: result.message } 
    };
  }
};

// =============================================================================
// HOOKS
// =============================================================================

/**
 * 🎯 User-Centric Leaderboard Hook
 * Shows user + nearby competitors instead of global top 10
 */
export const useUserCentricLeaderboard = (
  studentId: number,
  type: 'global' | 'class' | 'weekly' | 'monthly' = 'global',
  category: 'points' | 'streak' | 'exercises' | 'accuracy' = 'points',
  range: number = 3
) => {
  return useApiData(
    () => leaderboardApi.getUserCentricLeaderboard(studentId, type, category, range),
    { 
      cacheTime: 2, // 2 minutes - leaderboards change frequently
      autoFetch: !!studentId // Only fetch if studentId is provided
    }
  );
};

/**
 * 🏅 Student Badges Hook
 * Get all badges/achievements for a student
 */
export const useStudentBadges = (studentId: number) => {
  return useApiData(
    () => leaderboardApi.getStudentBadges(studentId),
    { 
      cacheTime: 10, // 10 minutes - badges don't change often
      autoFetch: !!studentId
    }
  );
};

/**
 * 📊 Leaderboard Statistics Hook
 * Get overall leaderboard stats
 */
export const useLeaderboardStats = () => {
  return useApiData(
    () => leaderboardApi.getLeaderboardStats(),
    { 
      cacheTime: 5 // 5 minutes
    }
  );
};

/**
 * 🏆 Competitions Hook
 * Get active competitions and challenges
 */
export const useCompetitions = () => {
  return useApiData(
    () => leaderboardApi.getCompetitions(),
    { 
      cacheTime: 15 // 15 minutes - competitions don't change often
    }
  );
};

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * 💪 Motivation Messages Hook
 * Generate personalized motivation based on leaderboard position
 */
export const useMotivationMessage = (userCentricData: UserCentricLeaderboard | null) => {
  return useCallback(() => {
    if (!userCentricData?.userEntry) {
      return "Commencez à jouer pour apparaître dans le classement ! 🚀";
    }

    const { context, userEntry } = userCentricData;
    const { percentile, beatingCount, nextTarget } = context;

    if (userEntry.rank === 1) {
      return "🏆 Vous êtes le champion ! Continuez comme ça !";
    }

    if (percentile >= 90) {
      return `⭐ Top ${Math.round(100 - percentile)}% ! Vous battez ${beatingCount} autres joueurs !`;
    }

    if (percentile >= 75) {
      return `🔥 Excellente performance ! Vous êtes dans le top 25% !`;
    }

    if (nextTarget) {
      const pointsNeeded = nextTarget.score - userEntry.score;
      return `🎯 À seulement ${pointsNeeded} points de battre ${nextTarget.student.prenom} !`;
    }

    return `💪 Continuez ! Vous battez ${beatingCount} autres joueurs !`;
  }, [userCentricData]);
};

/**
 * 🎨 Badge Styling Hook
 * Get appropriate styling for badge rarity
 */
export const useBadgeStyle = () => {
  return useCallback((rarity: 'common' | 'rare' | 'epic' | 'legendary') => {
    const styles = {
      common: {
        bg: 'bg-gray-100',
        border: 'border-gray-300',
        text: 'text-gray-700',
        glow: 'shadow-sm'
      },
      rare: {
        bg: 'bg-blue-100',
        border: 'border-blue-400',
        text: 'text-blue-800',
        glow: 'shadow-blue-200 shadow-lg'
      },
      epic: {
        bg: 'bg-purple-100',
        border: 'border-purple-400',
        text: 'text-purple-800',
        glow: 'shadow-purple-300 shadow-xl'
      },
      legendary: {
        bg: 'bg-gradient-to-r from-yellow-200 to-orange-200',
        border: 'border-yellow-400',
        text: 'text-yellow-900',
        glow: 'shadow-yellow-300 shadow-2xl animate-pulse'
      }
    };

    return styles[rarity] || styles.common;
  }, []);
};

/**
 * 🎯 Rank Change Icon Hook
 * Get appropriate icon and color for rank changes
 */
export const useRankChangeIcon = () => {
  return useCallback((rankChange: number) => {
    if (rankChange > 0) {
      return {
        icon: '⬆️',
        color: 'text-green-600',
        bg: 'bg-green-100'
      };
    } else if (rankChange < 0) {
      return {
        icon: '⬇️', 
        color: 'text-red-600',
        bg: 'bg-red-100'
      };
    }
    return {
      icon: '➖',
      color: 'text-gray-500',
      bg: 'bg-gray-100'
    };
  }, []);
};