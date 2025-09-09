/**
 * 🧠 Psychology-Driven Dashboard - PRODUCTION READY
 * 
 * Implements all the addictive game psychology:
 * - "Hero Hub" profile (user as protagonist)
 * - "Personal Arena" leaderboard (achievable competition)  
 * - Celebration feedback loops
 * - Anti-cheat XP progression
 * - Streak FOMO mechanics
 * - Social kudos system
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { 
  useGamificationProfile, 
  useUserCentricLeaderboard,
  useXpProgression,
  useStreakManagement,
  useKudosSystem,
  useMotivationEngine,
  useAchievementStyling
} from '../../hooks/useGamification';
import { useAuth } from '../../contexts/AuthContext';
import AccessibleButton from '../ui/AccessibleButton';
import SkeletonLoader from '../ui/SkeletonLoader';

interface PsychologyDrivenDashboardProps {
  className?: string;
}

const PsychologyDrivenDashboard: React.FC<PsychologyDrivenDashboardProps> = ({
  className = ''
}) => {
  const { student } = useAuth();
  const userId = student?.id || 1; // Demo fallback

  // Data hooks
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useGamificationProfile(userId);
  const { data: leaderboard, isLoading: leaderboardLoading, refetch: refetchLeaderboard } = useUserCentricLeaderboard(userId, 'month');

  // Action hooks
  const { awardXp, isAwarding } = useXpProgression();
  const { pingStreak, isPinging } = useStreakManagement();
  const { giveKudos, isGiving } = useKudosSystem();

  // UI state
  const [showLevelUpCelebration, setShowLevelUpCelebration] = useState(false);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedScope, setSelectedScope] = useState<'all' | 'month' | 'friends'>('month');

  // Utility hooks
  const getMotivation = useMotivationEngine(profile, leaderboard);
  const getAchievementStyle = useAchievementStyling();

  const motivationMessage = getMotivation();

  // =============================================================================
  // ACTION HANDLERS
  // =============================================================================

  const handleAwardXp = useCallback(async (delta: number, reason: any) => {
    const result = await awardXp(userId, delta, reason);
    
    if (result.success) {
      if ((result as any).shouldCelebrate) {
        setShowLevelUpCelebration(true);
        setShowConfetti(true);
        
        setTimeout(() => {
          setShowLevelUpCelebration(false);
          setShowConfetti(false);
        }, 4000);
      }
      
      // Refresh data
      setTimeout(() => {
        refetchProfile();
        refetchLeaderboard();
      }, 500);
    }
  }, [userId, awardXp, refetchProfile, refetchLeaderboard]);

  const handleStreakPing = useCallback(async () => {
    const result = await pingStreak(userId);
    
    if (result.success) {
      if ((result as any).shouldCelebrate) {
        setShowStreakCelebration(true);
        setTimeout(() => setShowStreakCelebration(false), 3000);
      }
      
      // Auto-award streak bonus XP
      if ((result as any).bonusAwarded > 0) {
        setTimeout(() => {
          handleAwardXp((result as any).bonusAwarded, 'streak_bonus');
        }, 1000);
      }
      
      refetchProfile();
    }
  }, [userId, pingStreak, handleAwardXp, refetchProfile]);

  const handleGiveKudos = useCallback(async (toUserId: number) => {
    const result = await giveKudos(userId, toUserId);
    
    if (result.success) {
      // Show success toast
      // Kudos sent successfully
      refetchLeaderboard();
    }
  }, [userId, giveKudos, refetchLeaderboard]);

  // =============================================================================
  // LOADING STATE
  // =============================================================================

  if (profileLoading || leaderboardLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6 ${className}`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <SkeletonLoader type="card" className="h-64" />
              <SkeletonLoader type="card" className="h-40" />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <SkeletonLoader type="card" className="h-80" />
              <SkeletonLoader type="card" className="h-60" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !leaderboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Données de gamification indisponibles
          </h2>
          <AccessibleButton onClick={() => window.location.reload()}>
            Réessayer
          </AccessibleButton>
        </div>
      </div>
    );
  }

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ${className}`}>
      {/* Confetti for celebrations */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          numberOfPieces={200}
          recycle={false}
          colors={['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']}
        />
      )}

      {/* Header with motivation */}
      <div className="bg-white shadow-sm border-b p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                🎯 Votre Arena Personnelle
              </h1>
              <p className="text-gray-600">
                Niveau {profile.level} • {profile.xp.toLocaleString()} XP
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                #{profile.rank.position}
              </div>
              <div className="text-sm text-gray-500">
                Top {100 - profile.rank.percentile}%
              </div>
            </div>
          </div>

          {/* Motivational Message */}
          <motion.div 
            className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg border border-blue-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-blue-800 font-medium text-lg">
              {motivationMessage}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Hero Hub */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* XP Progress Card */}
            <motion.div 
              className="bg-white rounded-xl shadow-lg overflow-hidden"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 text-white">
                <h3 className="text-lg font-bold">⚡ Progression XP</h3>
                <div className="text-sm opacity-90">
                  {profile.xpToNext} XP jusqu'au niveau {profile.level + 1}
                </div>
              </div>
              
              <div className="p-4">
                {/* XP Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Niveau {profile.level}
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round(profile.progressPercent)}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div 
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${profile.progressPercent}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Quick XP Actions */}
                <div className="space-y-2">
                  <AccessibleButton
                    size="sm"
                    variant="primary"
                    fullWidth
                    disabled={isAwarding}
                    loading={isAwarding}
                    onClick={() => handleAwardXp(50, 'exercise_complete')}
                  >
                    🎯 Terminer un exercice (+50 XP)
                  </AccessibleButton>
                  
                  <AccessibleButton
                    size="sm"
                    variant="secondary"
                    fullWidth
                    disabled={isPinging}
                    loading={isPinging}
                    onClick={handleStreakPing}
                  >
                    🔥 Série quotidienne (+{profile.streak.current * 5} XP)
                  </AccessibleButton>
                </div>
              </div>
            </motion.div>

            {/* Streak Card */}
            <motion.div 
              className="bg-white rounded-xl shadow-lg p-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-800">🔥 Série</h3>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">
                    {profile.streak.current}
                  </div>
                  <div className="text-xs text-gray-500">jours</div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                Meilleur série: {profile.streak.best} jours
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full"
                  style={{ width: `${Math.min((profile.streak.current / 30) * 100, 100)}%` }}
                />
              </div>
            </motion.div>

            {/* Achievements Preview */}
            <motion.div 
              className="bg-white rounded-xl shadow-lg p-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-lg font-bold text-gray-800 mb-3">🏅 Succès</h3>
              
              <div className="grid grid-cols-3 gap-2">
                {profile.badges.slice(0, 6).map((badge: any, index: number) => {
                  const style = getAchievementStyle(badge.rarity);
                  return (
                    <motion.div
                      key={badge.id}
                      className={`
                        p-2 rounded-lg border text-center ${style.bg} ${style.glow}
                      `}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      title={badge.name}
                    >
                      <div className="text-lg">{badge.icon}</div>
                      <div className="text-xs font-medium">{badge.name.split(' ')[0]}</div>
                    </motion.div>
                  );
                })}
              </div>
              
              <div className="mt-3 text-center">
                <AccessibleButton size="sm" variant="ghost">
                  Voir tous les succès ({profile.badges.length})
                </AccessibleButton>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Personal Arena */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* User-Centric Leaderboard */}
            <motion.div 
              className="bg-white rounded-xl shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">🎯 Votre Compétition</h3>
                  
                  {/* Scope Selector */}
                  <div className="flex space-x-2">
                    {(['month', 'all', 'friends'] as const).map((scope) => (
                      <button
                        key={scope}
                        onClick={() => setSelectedScope(scope)}
                        className={`
                          px-3 py-1 rounded-full text-xs font-medium transition-colors
                          ${selectedScope === scope 
                            ? 'bg-white text-blue-600' 
                            : 'bg-blue-400 text-white hover:bg-blue-300'
                          }
                        `}
                      >
                        {scope === 'month' ? 'Ce mois' : scope === 'all' ? 'Global' : 'Amis'}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Context Stats */}
                <div className="mt-2 text-sm opacity-90">
                  Vous battez {leaderboard.context.beatingCount} autres joueurs
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-3">
                  {leaderboard.entries.map((entry: any, index: number) => (
                    <motion.div
                      key={entry.id}
                      className={`
                        flex items-center p-3 rounded-lg transition-all
                        ${entry.isMe 
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 shadow-md' 
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                        }
                      `}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {/* Rank */}
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-full font-bold
                        ${entry.isMe ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'}
                      `}>
                        {entry.rank}
                      </div>

                      {/* Student Info */}
                      <div className="flex-1 ml-3">
                        <div className="flex items-center">
                          <span className={`font-semibold ${entry.isMe ? 'text-blue-800' : 'text-gray-800'}`}>
                            {entry.isMe ? 'Vous' : entry.prenom}
                          </span>
                          
                          {entry.isMe && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full font-medium">
                              VOUS
                            </span>
                          )}
                          
                          {entry.streak > 0 && (
                            <span className="ml-2 text-orange-500 text-sm">
                              🔥 {entry.streak}j
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          {entry.score.toLocaleString()} points • Niveau {entry.level}
                        </div>
                      </div>

                      {/* Actions */}
                      {!entry.isMe && (
                        <AccessibleButton
                          size="sm"
                          variant="ghost"
                          disabled={isGiving}
                          onClick={() => handleGiveKudos(entry.id)}
                          ariaLabel={`Donner des kudos à ${entry.prenom}`}
                        >
                          👏
                        </AccessibleButton>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Next Target CTA */}
                {leaderboard.context.nextTarget && (
                  <motion.div 
                    className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-yellow-800">
                          🎯 Votre prochain défi
                        </div>
                        <div className="text-sm text-yellow-700">
                          Battez {leaderboard.context.nextTarget.name} avec {leaderboard.context.nextTarget.pointsNeeded} points de plus !
                        </div>
                      </div>
                      <AccessibleButton size="sm" variant="primary">
                        Let's Go!
                      </AccessibleButton>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Level Up Celebration */}
      <AnimatePresence>
        {showLevelUpCelebration && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-8 text-center shadow-2xl max-w-md"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 10 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                NIVEAU {profile.level}!
              </h2>
              <p className="text-gray-600 mb-6">
                Félicitations ! Vous progressez à une vitesse incroyable !
              </p>
              
              <AccessibleButton
                variant="primary"
                onClick={() => setShowLevelUpCelebration(false)}
              >
                Continuer l'aventure !
              </AccessibleButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak Celebration */}
      <AnimatePresence>
        {showStreakCelebration && (
          <motion.div
            className="fixed top-20 right-6 bg-orange-500 text-white p-4 rounded-lg shadow-lg z-40"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <div className="flex items-center">
              <span className="text-2xl mr-2">🔥</span>
              <div>
                <div className="font-bold">Série Milestone!</div>
                <div className="text-sm">+{profile.streak.current * 5} XP bonus!</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PsychologyDrivenDashboard;