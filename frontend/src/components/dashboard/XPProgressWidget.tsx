/**
 * XP Progress Widget
 * 
 * Integrates with existing NextLevelXPSystem but adds:
 * - Real data from API
 * - Achievement celebrations
 * - Streak tracking
 * - Level-up animations
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NextLevelXPSystem from '../NextLevelXPSystem';
import { useStudentBadges } from '../../hooks/useLeaderboard';
import { useAuth } from '../../contexts/AuthContext';
import AccessibleButton from '../ui/AccessibleButton';

interface XPProgressWidgetProps {
  studentId: number;
  className?: string;
  size?: 'compact' | 'normal' | 'large';
  showAchievements?: boolean;
  interactive?: boolean;
}

const XPProgressWidget: React.FC<XPProgressWidgetProps> = ({
  studentId,
  className = '',
  size = 'normal',
  showAchievements = true,
  interactive = true
}) => {
  const { student } = useAuth();
  const { data: badges, isLoading: badgesLoading } = useStudentBadges(studentId);
  
  // Mock XP data - in real app, this would come from student context or API
  const [xpData, setXpData] = useState({
    currentXP: student?.totalXp || 850,
    level: student?.currentLevel || 12,
    maxXP: 1000,
    xpGained: 0,
    streak: 5,
    recentAchievements: [] as string[]
  });

  const [showCelebration, setShowCelebration] = useState(false);

  // Simulate XP gain for demo
  const gainXP = (amount: number) => {
    setXpData(prev => {
      const newXP = prev.currentXP + amount;
      const newLevel = Math.floor(newXP / 1000) + 1;
      const leveledUp = newLevel > prev.level;
      
      if (leveledUp) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }

      return {
        ...prev,
        currentXP: newXP % 1000 || 1000, // Reset to 0 when leveling up
        level: newLevel,
        xpGained: amount
      };
    });
  };

  // Recent achievements from badges
  const recentAchievements = badges
    ?.filter((badge: any) => {
      const earnedAt = new Date(badge.earnedAt);
      const daysSinceEarned = (Date.now() - earnedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceEarned <= 7; // Last 7 days
    })
    .slice(0, 3)
    .map((badge: any) => badge.title) || [];

  const handleLevelUp = (newLevel: number) => {
    // Level up achieved
    setShowCelebration(true);
    
    // Create confetti effect
    if (typeof window !== 'undefined') {
      // You could integrate with react-confetti here
    }
  };

  const handleMilestone = (milestone: number) => {
    // Milestone reached
  };

  if (badgesLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-100 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              ⚡ Progression
            </h3>
            <p className="text-sm text-gray-600">
              Niveau {xpData.level}
            </p>
          </div>
          
          {xpData.streak > 0 && (
            <motion.div 
              className="flex items-center bg-orange-100 px-3 py-1 rounded-full"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-orange-600 font-semibold text-sm">
                🔥 {xpData.streak} jours
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* XP Bar */}
      <div className="p-4">
        <NextLevelXPSystem
          currentXP={xpData.currentXP}
          maxXP={xpData.maxXP}
          level={xpData.level}
          xpGained={xpData.xpGained}
          streakActive={xpData.streak >= 3}
          recentAchievements={recentAchievements}
          onLevelUp={handleLevelUp}
          onMilestone={handleMilestone}
          size={size}
          theme="magic"
          enablePhysics={true}
          interactive={interactive}
        />

        {/* Quick XP Actions */}
        {interactive && (
          <div className="mt-4 flex space-x-2">
            <AccessibleButton
              size="sm"
              variant="secondary"
              onClick={() => gainXP(25)}
              ariaLabel="Simuler gain de 25 XP"
            >
              +25 XP
            </AccessibleButton>
            <AccessibleButton
              size="sm"
              variant="secondary"
              onClick={() => gainXP(100)}
              ariaLabel="Simuler gain de 100 XP"
            >
              +100 XP
            </AccessibleButton>
            <AccessibleButton
              size="sm"
              variant="secondary"
              onClick={() => gainXP(500)}
              ariaLabel="Simuler gain de 500 XP"
            >
              Level Up!
            </AccessibleButton>
          </div>
        )}
      </div>

      {/* Recent Achievements */}
      {showAchievements && recentAchievements.length > 0 && (
        <div className="border-t bg-gray-50 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            🏅 Succès récents
          </h4>
          <div className="space-y-1">
            {recentAchievements.map((achievement: any, index: number) => (
              <motion.div
                key={index}
                className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full inline-block mr-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {achievement}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-6 text-center shadow-2xl"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 10 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Félicitations !
              </h3>
              <p className="text-gray-600">
                Vous avez atteint le niveau {xpData.level} !
              </p>
              
              <AccessibleButton
                className="mt-4"
                onClick={() => setShowCelebration(false)}
                ariaLabel="Fermer la célébration"
              >
                Continuer
              </AccessibleButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default XPProgressWidget;