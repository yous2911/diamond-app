/**
 * 🎯 User-Centric Leaderboard Component
 * 
 * Psychology-driven design that makes competition feel personal and achievable:
 * - Shows "You vs nearby competitors" instead of intimidating global top 10
 * - Highlights next target to beat (immediate, achievable goal)
 * - Shows how many people you're beating (positive reinforcement)
 * - Motivational messaging based on position
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserCentricLeaderboard, useMotivationMessage, useRankChangeIcon, useBadgeStyle } from '../../hooks/useLeaderboard';
import SkeletonLoader from '../ui/SkeletonLoader';

interface UserCentricLeaderboardProps {
  studentId: number;
  type?: 'global' | 'class' | 'weekly' | 'monthly';
  category?: 'points' | 'streak' | 'exercises' | 'accuracy';
  className?: string;
  compact?: boolean;
}

const UserCentricLeaderboard: React.FC<UserCentricLeaderboardProps> = ({
  studentId,
  type = 'global',
  category = 'points',
  className = '',
  compact = false
}) => {
  const { data, isLoading, error, refetch } = useUserCentricLeaderboard(studentId, type, category, 3);
  const getMotivationMessage = useMotivationMessage(data);
  const getRankChangeIcon = useRankChangeIcon();
  const getBadgeStyle = useBadgeStyle();

  // Memoized motivation message for performance
  const motivationMessage = useMemo(() => getMotivationMessage(), [getMotivationMessage]);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <SkeletonLoader type="card" className="h-6 w-40" />
          <SkeletonLoader type="card" className="h-8 w-20" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonLoader key={i} type="card" className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.userEntry) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Pas encore de classement
          </h3>
          <p className="text-gray-500 mb-4">
            Commencez à jouer pour apparaître dans le leaderboard !
          </p>
          <button 
            onClick={refetch}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Actualiser
          </button>
        </div>
      </div>
    );
  }

  const { userEntry, competitors, context } = data;
  const { percentile, beatingCount, nextTarget } = context;

  // Combine user + competitors and sort by rank
  const allEntries = [userEntry, ...competitors].sort((a, b) => a.rank - b.rank);

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header with Motivation */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              🎯 Votre Classement
            </h2>
            <p className="text-sm text-gray-600 capitalize">
              {type} • {category}
            </p>
          </div>
          
          {!compact && (
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">
                #{userEntry.rank}
              </div>
              <div className="text-xs text-gray-500">
                Top {100 - percentile}%
              </div>
            </div>
          )}
        </div>
        
        {/* Motivational Message */}
        <motion.div 
          className="mt-3 p-3 bg-white/60 rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-sm font-medium text-indigo-700">
            {motivationMessage}
          </p>
        </motion.div>

        {/* Next Target Call-to-Action */}
        {nextTarget && (
          <motion.div 
            className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-yellow-700 font-medium">
                🎯 Votre prochain défi:
              </span>
              <span className="text-yellow-800 font-bold">
                Battez {nextTarget.student.prenom} !
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Leaderboard Entries */}
      <div className="p-4">
        <AnimatePresence>
          {allEntries.map((entry, index) => {
            const isUser = entry.studentId === studentId;
            const rankIcon = getRankChangeIcon(entry.rankChange);
            
            return (
              <motion.div
                key={entry.studentId}
                className={`
                  flex items-center p-3 rounded-lg mb-2 transition-all
                  ${isUser 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }
                `}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={isUser ? { scale: 1.02 } : { scale: 1.01 }}
              >
                {/* Rank */}
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm
                  ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}
                `}>
                  {entry.rank}
                </div>

                {/* Student Info */}
                <div className="flex-1 ml-3">
                  <div className="flex items-center">
                    <div className={`
                      font-semibold ${isUser ? 'text-blue-800' : 'text-gray-800'}
                    `}>
                      {isUser ? 'Vous' : entry.student.prenom}
                      {isUser && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                          VOUS
                        </span>
                      )}
                    </div>

                    {/* Badges Preview */}
                    {entry.badges.length > 0 && (
                      <div className="ml-2 flex space-x-1">
                        {entry.badges.slice(0, 2).map((badge: any, i: number) => (
                          <div
                            key={i}
                            className={`
                              text-xs px-1 py-0.5 rounded ${getBadgeStyle(badge.rarity).bg}
                            `}
                            title={badge.title}
                          >
                            {badge.icon || '🏅'}
                          </div>
                        ))}
                        {entry.badges.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{entry.badges.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 flex items-center mt-1">
                    <span>{entry.score} points</span>
                    {entry.streak && entry.streak > 0 && (
                      <span className="ml-2 text-orange-500">
                        🔥 {entry.streak} jours
                      </span>
                    )}
                  </div>
                </div>

                {/* Rank Change */}
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-xs
                  ${rankIcon.bg}
                `}>
                  <span className={rankIcon.color}>
                    {rankIcon.icon}
                  </span>
                </div>

                {/* Score */}
                <div className="text-right ml-3">
                  <div className={`
                    font-bold ${isUser ? 'text-blue-600' : 'text-gray-600'}
                  `}>
                    {entry.score.toLocaleString()}
                  </div>
                  {entry.rankChange !== 0 && (
                    <div className={`text-xs ${rankIcon.color}`}>
                      {entry.rankChange > 0 ? '+' : ''}{entry.rankChange}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Context Stats */}
        {!compact && (
          <motion.div 
            className="mt-4 p-3 bg-gray-50 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">
                  {beatingCount}
                </div>
                <div className="text-xs text-gray-500">
                  joueurs battus
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {percentile}%
                </div>
                <div className="text-xs text-gray-500">
                  percentile
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UserCentricLeaderboard;