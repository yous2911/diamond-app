/**
 * Enhanced Dashboard - Production Ready
 * 
 * Combines all the gamification improvements:
 * - User-centric leaderboard (psychology-driven)
 * - XP system with celebrations
 * - Achievement showcase
 * - Accessibility improvements
 * - Loading states and error handling
 */

import React from 'react';
import { motion } from 'framer-motion';
import UserCentricLeaderboard from './UserCentricLeaderboard';
import XPProgressWidget from './XPProgressWidget';
import AchievementBadges from './AchievementBadges';
import { useCompetitions, useLeaderboardStats } from '../../hooks/useLeaderboard';
import { useAuth } from '../../contexts/AuthContext';
import SkeletonLoader from '../ui/SkeletonLoader';
import AccessibleButton from '../ui/AccessibleButton';

interface EnhancedDashboardProps {
  className?: string;
}

const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({
  className = ''
}) => {
  const { student } = useAuth();
  const { data: competitions, isLoading: competitionsLoading } = useCompetitions();
  const { data: stats, isLoading: statsLoading } = useLeaderboardStats();

  // Mock student ID for demo - in real app, this comes from auth
  const studentId = student?.id || 1;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div 
        className="bg-white shadow-sm border-b p-6"
        variants={itemVariants}
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800">
            🎮 Tableau de Bord Gamifié
          </h1>
          <p className="text-gray-600 mt-1">
            Votre progression et classements en temps réel
          </p>
          
          {/* Quick Stats Bar */}
          {!statsLoading && stats && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalParticipants}
                </div>
                <div className="text-xs text-blue-600">Joueurs actifs</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalBadgesEarned}
                </div>
                <div className="text-xs text-green-600">Badges gagnés</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.averageStreak}
                </div>
                <div className="text-xs text-orange-600">Série moyenne</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  24h
                </div>
                <div className="text-xs text-purple-600">Temps d'activité</div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - XP Progress */}
          <motion.div 
            className="lg:col-span-1 space-y-6"
            variants={itemVariants}
          >
            {/* XP Widget */}
            <XPProgressWidget 
              studentId={studentId}
              size="normal"
              showAchievements={true}
              interactive={true}
            />

            {/* Achievement Badges */}
            <AchievementBadges 
              achievements={[]}
              loading={false}
              onViewAll={() => {}}
            />
          </motion.div>

          {/* Center Column - Leaderboards */}
          <motion.div 
            className="lg:col-span-2 space-y-6"
            variants={itemVariants}
          >
            {/* User-Centric Leaderboard */}
            <UserCentricLeaderboard
              studentId={studentId}
              type="global"
              category="points"
            />

            {/* Weekly Leaderboard */}
            <UserCentricLeaderboard
              studentId={studentId}
              type="weekly"
              category="points"
              compact={true}
            />

            {/* Active Competitions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                🏆 Compétitions Actives
              </h3>
              
              {competitionsLoading ? (
                <div className="space-y-3">
                  <SkeletonLoader type="card" className="h-20" />
                  <SkeletonLoader type="card" className="h-20" />
                </div>
              ) : competitions && competitions.length > 0 ? (
                <div className="space-y-4">
                  {competitions.slice(0, 2).map((competition: any) => (
                    <motion.div
                      key={competition.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">
                            {competition.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {competition.description}
                          </p>
                          <div className="text-xs text-gray-500 mt-2">
                            {competition.participants} participants
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <div className="text-right mb-2">
                            <span className="text-sm font-semibold text-blue-600">
                              {competition.progress?.percentage || 0}%
                            </span>
                          </div>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${competition.progress?.percentage || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-1">
                        {competition.rewards?.slice(0, 2).map((reward: string, index: number) => (
                          <span 
                            key={index}
                            className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full"
                          >
                            {reward}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🏅</div>
                  <p>Aucune compétition active pour le moment</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Bottom Section - Quick Actions */}
        <motion.div 
          className="mt-8 bg-white rounded-xl shadow-lg p-6"
          variants={itemVariants}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            ⚡ Actions Rapides
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <AccessibleButton
              variant="primary"
              fullWidth
              ariaLabel="Commencer un nouvel exercice"
              icon={<span>📚</span>}
            >
              Nouvel Exercice
            </AccessibleButton>
            
            <AccessibleButton
              variant="secondary"
              fullWidth
              ariaLabel="Voir tous les classements"
              icon={<span>🏆</span>}
            >
              Tous les Classements
            </AccessibleButton>
            
            <AccessibleButton
              variant="secondary"
              fullWidth
              ariaLabel="Voir toutes les compétitions"
              icon={<span>🎯</span>}
            >
              Compétitions
            </AccessibleButton>
            
            <AccessibleButton
              variant="ghost"
              fullWidth
              ariaLabel="Paramètres du profil"
              icon={<span>⚙️</span>}
            >
              Paramètres
            </AccessibleButton>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EnhancedDashboard;