/**
 * 🎮 Gamification Hooks - Production Ready
 * 
 * Connects to the new gamification API endpoints with:
 * - Anti-cheat XP progression
 * - User-centric leaderboards  
 * - Streak tracking with FOMO
 * - Achievement system
 * - Social kudos features
 */

import { useCallback, useState } from 'react';
import { useApiData } from './useApiData';

// =============================================================================
// TYPES
// =============================================================================

interface ProfileData {
  xp: number;
  level: number;
  nextLevelXp: number;
  xpToNext: number;
  progressPercent: number;
  streak: {
    current: number;
    best: number;
    lastActiveDate: string;
  };
  badges: Achievement[];
  rank: {
    position: number;
    total: number;
    percentile: number;
    nearby: LeaderboardEntry[];
    beatingCount: number;
  };
}

interface LeaderboardEntry {
  id: number;
  prenom: string;
  nom: string;
  xp: number;
  level: number;
  mascotteType: string;
  rank: number;
  isMe: boolean;
  score: number;
  badges: Achievement[];
  streak: number;
}

interface UserCentricLeaderboard {
  entries: LeaderboardEntry[];
  context: {
    userRank: number;
    totalParticipants: number;
    percentile: number;
    beatingCount: number;
    nextTarget?: {
      name: string;
      pointsNeeded: number;
      rank: number;
    };
  };
}

interface Achievement {
  id: number;
  code: string;
  name: string;
  description?: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface XpResult {
  xpAwarded: number;
  newXp: number;
  newLevel: number;
  leveledUp: boolean;
  reason: string;
}

interface StreakResult {
  current: number;
  best: number;
  bonusAwarded: number;
  milestone: boolean;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

const gamificationApi = {
  // Profile data (Hero Hub)
  getProfile: async (userId: number) => {
    const response = await fetch(`/api/profile/${userId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    return { 
      success: result.success, 
      data: result.data as ProfileData,
      error: result.success ? undefined : { message: result.message } 
    };
  },

  // Award XP (server-validated)
  awardXp: async (userId: number, delta: number, reason: string) => {
    const response = await fetch('/api/progress/xp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, delta, reason })
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    
    return { 
      success: result.success, 
      data: result.data as XpResult,
      error: result.success ? undefined : { message: result.message } 
    };
  },

  // User-centric leaderboard
  getLeaderboard: async (userId: number, scope: 'all' | 'month' | 'friends' = 'month') => {
    const params = new URLSearchParams({
      userId: userId.toString(),
      scope,
      centerOnMe: 'true'
    });
    
    const response = await fetch(`/api/leaderboard?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    return { 
      success: result.success, 
      data: result.data as UserCentricLeaderboard,
      error: result.success ? undefined : { message: result.message } 
    };
  },

  // Streak ping (daily)
  pingStreak: async (userId: number) => {
    const response = await fetch('/api/streak/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    
    return { 
      success: result.success, 
      data: result.data as StreakResult,
      error: result.success ? undefined : { message: result.message } 
    };
  },

  // Give kudos (rate limited)
  giveKudos: async (fromUser: number, toUser: number) => {
    const response = await fetch('/api/kudos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromUser, toUser })
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
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
 * 👤 Hero Hub Profile Hook
 * Complete gamification profile with XP, level, streaks, badges, nearby ranks
 */
export const useGamificationProfile = (userId: number) => {
  return useApiData(
    () => gamificationApi.getProfile(userId),
    { 
      cacheTime: 0.5, // 30 seconds - profile changes frequently
      autoFetch: !!userId
    }
  );
};

/**
 * 🏆 User-Centric Leaderboard Hook
 * Shows user + nearby competitors (psychology-driven)
 */
export const useUserCentricLeaderboard = (
  userId: number, 
  scope: 'all' | 'month' | 'friends' = 'month'
) => {
  return useApiData(
    () => gamificationApi.getLeaderboard(userId, scope),
    { 
      cacheTime: 0.25, // 15 seconds - leaderboards change often
      autoFetch: !!userId
    }
  );
};

/**
 * ⚡ XP Management Hook
 * Server-validated XP progression with anti-cheat
 */
export const useXpProgression = () => {
  const [isAwarding, setIsAwarding] = useState(false);
  const [xpError, setXpError] = useState<string | null>(null);

  const awardXp = useCallback(async (
    userId: number, 
    delta: number, 
    reason: 'login' | 'exercise_complete' | 'streak_bonus' | 'achievement' | 'daily_challenge'
  ) => {
    setIsAwarding(true);
    setXpError(null);

    try {
      const result = await gamificationApi.awardXp(userId, delta, reason);
      
      if (result.success) {
        return {
          success: true,
          ...result.data,
          // Trigger UI celebrations for level up
          shouldCelebrate: result.data.leveledUp
        };
      } else {
        setXpError(result.error?.message || 'XP award failed');
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      setXpError(errorMessage);
      return { success: false, error: { message: errorMessage } };
    } finally {
      setIsAwarding(false);
    }
  }, []);

  return {
    awardXp,
    isAwarding,
    error: xpError,
    clearError: () => setXpError(null)
  };
};

/**
 * 🔥 Streak Management Hook
 * Daily streak tracking with FOMO mechanics
 */
export const useStreakManagement = () => {
  const [isPinging, setIsPinging] = useState(false);
  const [streakError, setStreakError] = useState<string | null>(null);

  const pingStreak = useCallback(async (userId: number) => {
    setIsPinging(true);
    setStreakError(null);

    try {
      const result = await gamificationApi.pingStreak(userId);
      
      if (result.success) {
        return {
          success: true,
          ...result.data,
          // Trigger UI celebrations for milestones
          shouldCelebrate: result.data.milestone
        };
      } else {
        setStreakError(result.error?.message || 'Streak update failed');
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      setStreakError(errorMessage);
      return { success: false, error: { message: errorMessage } };
    } finally {
      setIsPinging(false);
    }
  }, []);

  return {
    pingStreak,
    isPinging,
    error: streakError,
    clearError: () => setStreakError(null)
  };
};

/**
 * 👏 Social Kudos Hook
 * Rate-limited social recognition system
 */
export const useKudosSystem = () => {
  const [isGiving, setIsGiving] = useState(false);
  const [kudosError, setKudosError] = useState<string | null>(null);

  const giveKudos = useCallback(async (fromUser: number, toUser: number) => {
    setIsGiving(true);
    setKudosError(null);

    try {
      const result = await gamificationApi.giveKudos(fromUser, toUser);
      
      if (result.success) {
        return {
          success: true,
          ...result.data
        };
      } else {
        setKudosError(result.error?.message || 'Kudos failed');
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      setKudosError(errorMessage);
      return { success: false, error: { message: errorMessage } };
    } finally {
      setIsGiving(false);
    }
  }, []);

  return {
    giveKudos,
    isGiving,
    error: kudosError,
    clearError: () => setKudosError(null)
  };
};

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * 🎯 Motivation Engine Hook
 * Generate personalized motivation messages based on leaderboard psychology
 */
export const useMotivationEngine = (profileData: ProfileData | null, leaderboardData: UserCentricLeaderboard | null) => {
  return useCallback(() => {
    if (!profileData || !leaderboardData) {
      return "Commencez à jouer pour voir votre progression ! 🚀";
    }

    const { rank } = profileData;
    const { context } = leaderboardData;

    // Champion (Rank #1)
    if (rank.position === 1) {
      return "🏆 Vous dominez le classement ! Maintenez votre avance !";
    }

    // Elite (Top 5%)
    if (rank.percentile >= 95) {
      return `⭐ Élite absolue ! Top ${Math.round(100 - rank.percentile)}% - Vous battez ${rank.beatingCount} joueurs !`;
    }

    // High performers (Top 25%)
    if (rank.percentile >= 75) {
      return `🔥 Performance exceptionnelle ! Vous êtes dans le top 25% !`;
    }

    // Next target focus (core psychology)
    if (context.nextTarget) {
      const { name, pointsNeeded } = context.nextTarget;
      return `🎯 À seulement ${pointsNeeded} points de battre ${name} ! Vous pouvez le faire !`;
    }

    // Positive reinforcement for everyone else
    return `💪 Continuez ! Vous battez ${rank.beatingCount} autres joueurs - montrez-leur de quoi vous êtes capable !`;
  }, [profileData, leaderboardData]);
};

/**
 * 🎨 Achievement Rarity Styling Hook
 * Dynamic styling based on achievement rarity
 */
export const useAchievementStyling = () => {
  return useCallback((rarity: Achievement['rarity']) => {
    const styles = {
      common: {
        bg: 'bg-gray-100 border-gray-300',
        text: 'text-gray-800',
        glow: 'shadow-md',
        animation: ''
      },
      rare: {
        bg: 'bg-blue-100 border-blue-400',
        text: 'text-blue-800',
        glow: 'shadow-blue-200 shadow-lg',
        animation: ''
      },
      epic: {
        bg: 'bg-purple-100 border-purple-400',
        text: 'text-purple-800',
        glow: 'shadow-purple-300 shadow-xl',
        animation: 'animate-pulse'
      },
      legendary: {
        bg: 'bg-gradient-to-r from-yellow-200 to-orange-200 border-yellow-400',
        text: 'text-yellow-900',
        glow: 'shadow-yellow-400 shadow-2xl',
        animation: 'animate-bounce'
      }
    };

    return styles[rarity];
  }, []);
};

/**
 * 📊 Progress Animation Hook
 * Smooth XP bar animations
 */
export const useProgressAnimation = (currentXp: number, targetXp: number) => {
  const [displayXp, setDisplayXp] = useState(currentXp);

  const animateToTarget = useCallback(() => {
    const difference = targetXp - displayXp;
    if (Math.abs(difference) < 1) return;

    const step = difference * 0.1;
    const newXp = displayXp + step;
    
    setDisplayXp(Math.abs(difference) < 1 ? targetXp : newXp);
  }, [displayXp, targetXp]);

  return { displayXp, animateToTarget };
};

export default {
  useGamificationProfile,
  useUserCentricLeaderboard,
  useXpProgression,
  useStreakManagement,
  useKudosSystem,
  useMotivationEngine,
  useAchievementStyling,
  useProgressAnimation
};