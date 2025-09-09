import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import XPCrystal from './XPCrystal';

// Types for the progress portal
export type PortalView = 'overview' | 'journey' | 'achievements' | 'stats';

interface ProgressData {
  currentXP: number;
  maxXP: number;
  level: number;
  nextLevelXP: number;
  currentStreak: number;
  maxStreak: number;
  totalExercises: number;
  completedExercises: number;
  badges: Badge[];
  recentAchievements: Achievement[];
  weeklyProgress: WeeklyProgress[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
  isNew?: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  completedAt: Date;
  icon: string;
}

interface WeeklyProgress {
  day: string;
  xpGained: number;
  exercisesCompleted: number;
  streakActive: boolean;
}

interface MagicalIsland {
  id: string;
  name: string;
  description: string;
  progress: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  theme: 'forest' | 'castle' | 'ocean' | 'mountain' | 'space' | 'crystal';
  exerciseCount: number;
  completedCount: number;
  icon: string;
  prerequisiteIsland?: string;
  position: { x: number; y: number };
}

interface ProgressPortalProps {
  progressData: ProgressData;
  magicalIslands?: MagicalIsland[];
  currentView?: PortalView;
  onViewChange?: (view: PortalView) => void;
  onIslandSelect?: (island: MagicalIsland) => void;
  onBadgeClick?: (badge: Badge) => void;
  enableSounds?: boolean;
  enableHaptics?: boolean;
  showAnimations?: boolean;
  className?: string;
}

// Configuration for island themes
const getIslandTheme = (theme: MagicalIsland['theme']): any => {
  switch (theme) {
    case 'forest':
      return {
        colors: 'from-green-400 to-emerald-600',
        icon: '🌲',
        glow: 'shadow-green-400'
      };
    case 'castle':
      return {
        colors: 'from-purple-400 to-violet-600',
        icon: '🏰',
        glow: 'shadow-purple-400'
      };
    case 'ocean':
      return {
        colors: 'from-blue-400 to-cyan-600',
        icon: '🌊',
        glow: 'shadow-blue-400'
      };
    case 'mountain':
      return {
        colors: 'from-gray-400 to-slate-600',
        icon: '⛰️',
        glow: 'shadow-gray-400'
      };
    case 'space':
      return {
        colors: 'from-indigo-400 to-purple-600',
        icon: '🚀',
        glow: 'shadow-indigo-400'
      };
    case 'crystal':
      return {
        colors: 'from-pink-400 to-rose-600',
        icon: '💎',
        glow: 'shadow-pink-400'
      };
    default:
      return getIslandTheme('forest');
  }
};

// Badge rarity colors
const getBadgeRarityColor = (rarity: Badge['rarity']): string => {
  switch (rarity) {
    case 'common': return 'bg-gray-200 text-gray-700';
    case 'uncommon': return 'bg-green-200 text-green-700';
    case 'rare': return 'bg-blue-200 text-blue-700';
    case 'epic': return 'bg-purple-200 text-purple-700';
    case 'legendary': return 'bg-yellow-200 text-yellow-700';
    default: return 'bg-gray-200 text-gray-700';
  }
};

export const ProgressPortal: React.FC<ProgressPortalProps> = ({
  progressData,
  magicalIslands = [],
  currentView = 'overview',
  onViewChange,
  onIslandSelect,
  onBadgeClick,
  enableSounds = true,
  enableHaptics = true,
  showAnimations = true,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<PortalView>(currentView);

  const handleViewChange = useCallback((view: PortalView) => {
    setActiveView(view);
    onViewChange?.(view);
  }, [onViewChange]);

  const togglePortal = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  // Overview View
  const OverviewView = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* XP Crystal */}
      <div className="flex justify-center">
        <XPCrystal
          xp={progressData.currentXP}
          maxXp={progressData.maxXP}
          level={progressData.level}
          crystalType="rainbow"
          size="large"
          onLevelUp={() => {/* Level up handled */}}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{progressData.currentStreak}</div>
          <div className="text-sm text-white/80">Jours consécutifs</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{progressData.completedExercises}</div>
          <div className="text-sm text-white/80">Exercices terminés</div>
        </div>
      </div>

      {/* Weekly Progress */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Progression hebdomadaire</h3>
        <div className="grid grid-cols-7 gap-2">
          {progressData.weeklyProgress.map((day, index) => (
            <div key={index} className="text-center">
              <div className="text-xs text-white/60 mb-1">{day.day}</div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                day.streakActive ? 'bg-green-500' : 'bg-white/20'
              }`}>
                {day.xpGained}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  // Journey View
  const JourneyView = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h3 className="text-xl font-bold text-white text-center">Carte du Voyage Magique</h3>
      
      <div className="relative min-h-96 bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl p-6">
        {magicalIslands.map((island, index) => {
          const theme = getIslandTheme(island.theme);
          const isAccessible = island.isUnlocked || !island.prerequisiteIsland;
          
          return (
            <motion.div
              key={island.id}
              className={`absolute w-16 h-16 rounded-full flex items-center justify-center cursor-pointer ${
                isAccessible ? 'opacity-100' : 'opacity-40'
              }`}
              style={{
                left: `${island.position.x}%`,
                top: `${island.position.y}%`
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={isAccessible ? { scale: 1.1 } : {}}
              onClick={() => isAccessible && onIslandSelect?.(island)}
            >
              <div className={`
                w-full h-full rounded-full bg-gradient-to-br ${theme.colors}
                flex items-center justify-center text-2xl
                ${theme.glow} border-2 border-white/30
                ${island.isCompleted ? 'ring-4 ring-yellow-400' : ''}
              `}>
                {theme.icon}
              </div>
              
              {/* Progress indicator */}
              {island.progress > 0 && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-xs text-white">
                  {Math.round(island.progress * 100)}%
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );

  // Achievements View
  const AchievementsView = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h3 className="text-xl font-bold text-white text-center">Badges et Réalisations</h3>
      
      {/* Recent Achievements */}
      <div className="space-y-3">
        {progressData.recentAchievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4"
          >
            <div className="text-3xl">{achievement.icon}</div>
            <div className="flex-1">
              <div className="font-semibold text-white">{achievement.title}</div>
              <div className="text-sm text-white/80">{achievement.description}</div>
              <div className="text-xs text-green-400">+{achievement.xpReward} XP</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-3 gap-3">
        {progressData.badges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`
              bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center cursor-pointer
              ${badge.isNew ? 'ring-2 ring-yellow-400' : ''}
            `}
            onClick={() => onBadgeClick?.(badge)}
          >
            <div className="text-2xl mb-2">{badge.icon}</div>
            <div className="text-xs text-white font-medium">{badge.name}</div>
            <div className={`text-xs px-2 py-1 rounded-full mt-2 ${getBadgeRarityColor(badge.rarity)}`}>
              {badge.rarity}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  // Stats View
  const StatsView = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h3 className="text-xl font-bold text-white text-center">Statistiques Détaillées</h3>
      
      <div className="space-y-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white">Progression du niveau</span>
            <span className="text-white font-bold">
              {progressData.currentXP} / {progressData.nextLevelXP} XP
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(progressData.currentXP / progressData.nextLevelXP) * 100}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{progressData.totalExercises}</div>
            <div className="text-sm text-white/80">Total exercices</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{progressData.maxStreak}</div>
            <div className="text-sm text-white/80">Meilleur streak</div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={className}>
      {/* Portal Trigger Button */}
      <motion.button
        onClick={togglePortal}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg hover:shadow-xl text-white text-2xl flex items-center justify-center z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        🚪
      </motion.button>

      {/* Portal Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={togglePortal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-3xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">Portail de Progression</h2>
                <button
                  onClick={togglePortal}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex space-x-2 mb-6">
                {(['overview', 'journey', 'achievements', 'stats'] as PortalView[]).map((view) => (
                  <button
                    key={view}
                    onClick={() => handleViewChange(view)}
                    className={`
                      px-4 py-2 rounded-xl font-medium transition-all
                      ${activeView === view
                        ? 'bg-white/20 text-white'
                        : 'text-white/60 hover:text-white/80 hover:bg-white/10'
                      }
                    `}
                  >
                    {view === 'overview' && 'Vue d\'ensemble'}
                    {view === 'journey' && 'Voyage'}
                    {view === 'achievements' && 'Réalisations'}
                    {view === 'stats' && 'Statistiques'}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="min-h-96">
                {activeView === 'overview' && <OverviewView />}
                {activeView === 'journey' && <JourneyView />}
                {activeView === 'achievements' && <AchievementsView />}
                {activeView === 'stats' && <StatsView />}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
