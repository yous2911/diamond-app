/**
 * WORLD-CLASS PARENT DASHBOARD
 * Impressive real-time analytics and insights for parents
 * Integrates with existing FastRevEd Kids full-stack architecture
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Brain, Award, Clock, Target, Calendar,
  BookOpen, Zap, Star, Heart, Trophy, ChevronRight,
  BarChart3, PieChart, Activity, Users, Settings
} from 'lucide-react';
import { parentApi, ChildData, ChildAnalytics, SuperMemoStats } from '../services/parentApi';
import { useAuth } from '../contexts/AuthContext';
import RealTimeNotifications from '../components/RealTimeNotifications';

// =============================================================================
// PARENT DASHBOARD COMPONENT
// =============================================================================

const ParentDashboard: React.FC = () => {
  const { student } = useAuth();
  const [selectedChild, setSelectedChild] = useState(0);
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'year'>('week');
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'insights' | 'settings'>('overview');
  
  // Real API data state
  const [childrenData, setChildrenData] = useState<ChildData[]>([]);
  const [childAnalytics, setChildAnalytics] = useState<ChildAnalytics | null>(null);
  const [superMemoStats, setSuperMemoStats] = useState<SuperMemoStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch children data on mount
  useEffect(() => {
    const fetchChildrenData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // For demo purposes, we'll use mock parent ID
        // In real implementation, this would come from parent auth context
        const parentId = (student as any)?.parentId || 1;
        
        const children = await parentApi.getChildren(parentId);
        setChildrenData(children);
        
        if (children.length > 0) {
          // Load analytics for first child by default
          const analytics = await parentApi.getChildAnalytics(children[0].id, timeFrame);
          const superMemo = await parentApi.getSuperMemoStats(children[0].id);
          
          setChildAnalytics(analytics);
          setSuperMemoStats(superMemo);
        }
      } catch (err) {
        console.error('Error fetching children data:', err);
        setError('Failed to load dashboard data. Using demo data.');
        
        // Fallback to mock data if API fails
        const mockChild: ChildData = {
          id: 1,
          name: 'Emma Dubois',
          age: 7,
          level: 'CE1',
          avatar: '👧',
          totalXP: 2840,
          currentStreak: 12,
          completedExercises: 156,
          masteredCompetencies: 23,
          currentLevel: 8,
          lastActivity: new Date().toISOString()
        };
        
        setChildrenData([mockChild]);
        
        // Mock analytics data
        setChildAnalytics({
          weeklyProgress: [85, 92, 78, 95, 88, 91, 97],
          recentAchievements: [
            { id: 1, title: 'Mathématiques Maître', icon: '🧮', date: '2024-01-15', color: 'bg-blue-500' },
            { id: 2, title: '7 jours consécutifs', icon: '🔥', date: '2024-01-14', color: 'bg-orange-500' },
            { id: 3, title: 'Lecture Rapide', icon: '📚', date: '2024-01-13', color: 'bg-green-500' }
          ],
          competencyProgress: [
            { domain: 'Français', progress: 78, total: 45, mastered: 35 },
            { domain: 'Mathématiques', progress: 92, total: 38, mastered: 35 },
            { domain: 'Découverte du Monde', progress: 65, total: 28, mastered: 18 }
          ],
          learningPattern: {
            bestTime: 'Matin (9h-11h)',
            averageSession: '18 min',
            preferredSubject: 'Mathématiques',
            difficultyTrend: 'Progressive'
          }
        });
        
        setSuperMemoStats({
          retention: 94.2,
          averageInterval: 4.8,
          stabilityIndex: 8.7,
          retrievalStrength: 0.92,
          totalReviews: 156,
          successRate: 87.5
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChildrenData();
  }, [timeFrame]);

  // Handle child selection changes
  useEffect(() => {
    const fetchChildData = async () => {
      if (childrenData.length > 0 && childrenData[selectedChild]) {
        try {
          const childId = childrenData[selectedChild].id;
          const analytics = await parentApi.getChildAnalytics(childId, timeFrame);
          const superMemo = await parentApi.getSuperMemoStats(childId);
          
          setChildAnalytics(analytics);
          setSuperMemoStats(superMemo);
        } catch (err) {
          console.error('Error fetching child analytics:', err);
        }
      }
    };

    if (!isLoading) {
      fetchChildData();
    }
  }, [selectedChild, childrenData, timeFrame, isLoading]);

  const selectedChildData = childrenData[selectedChild];

  // Beautiful gradient backgrounds for different metrics
  const gradients = {
    xp: 'bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500',
    streak: 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-500',
    exercises: 'bg-gradient-to-br from-green-500 via-teal-500 to-cyan-500',
    competencies: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <h2 className="text-xl font-semibold text-gray-700">Chargement du tableau de bord...</h2>
          <p className="text-gray-500">Récupération des données des enfants</p>
        </motion.div>
      </div>
    );
  }

  // Error state with fallback to demo data
  if (error && childrenData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="text-center max-w-md mx-auto p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Erreur de connexion</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors"
          >
            Réessayer
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Real-time notifications for parents */}
      <RealTimeNotifications 
        userId={(student as any)?.parentId || 1} 
        userType="parent" 
      />
      
      {/* Error banner for fallback data */}
      {error && (
        <motion.div
          className="bg-yellow-100 border-l-4 border-yellow-500 p-4"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-yellow-500 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Mode démonstration:</strong> {error} Les données affichées sont des exemples.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => window.location.reload()}
                className="text-yellow-700 hover:text-yellow-900 text-sm underline"
              >
                Réessayer
              </button>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Header with child selector and navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                FastRevEd Kids
              </div>
              <div className="text-gray-400">|</div>
              <div className="text-lg font-medium text-gray-700">Tableau de Bord Parents</div>
            </div>

            {/* Child Selector */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(Number(e.target.value))}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {childrenData.map((child, index) => (
                  <option key={child.id} value={index}>
                    {child.avatar} {child.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                {(['overview', 'progress', 'insights', 'settings'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Child Profile Header */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center text-3xl">
                      {selectedChildData.avatar}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{selectedChildData.name}</h1>
                      <p className="text-gray-600">
                        {selectedChildData.age} ans • Niveau {selectedChildData.level} • Niveau {selectedChildData.currentLevel}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1">
                          <Zap className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-gray-600">{selectedChildData.currentStreak} jours</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-gray-600">{selectedChildData.totalXP} XP</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Time Frame Selector */}
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                    {(['week', 'month', 'year'] as const).map((frame) => (
                      <button
                        key={frame}
                        onClick={() => setTimeFrame(frame)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          timeFrame === frame
                            ? 'bg-white text-purple-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {frame === 'week' ? 'Semaine' : frame === 'month' ? 'Mois' : 'Année'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  className={`${gradients.xp} rounded-2xl p-6 text-white shadow-lg`}
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium">Points d'Expérience</p>
                      <p className="text-3xl font-bold mt-1">{selectedChildData.totalXP.toLocaleString()}</p>
                      <p className="text-white/80 text-sm mt-1">+340 cette semaine</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className={`${gradients.streak} rounded-2xl p-6 text-white shadow-lg`}
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium">Série Actuelle</p>
                      <p className="text-3xl font-bold mt-1">{selectedChildData.currentStreak}</p>
                      <p className="text-white/80 text-sm mt-1">jours consécutifs</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className={`${gradients.exercises} rounded-2xl p-6 text-white shadow-lg`}
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium">Exercices Réalisés</p>
                      <p className="text-3xl font-bold mt-1">{selectedChildData.completedExercises}</p>
                      <p className="text-white/80 text-sm mt-1">+23 cette semaine</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className={`${gradients.competencies} rounded-2xl p-6 text-white shadow-lg`}
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium">Compétences Maîtrisées</p>
                      <p className="text-3xl font-bold mt-1">{selectedChildData.masteredCompetencies}</p>
                      <p className="text-white/80 text-sm mt-1">sur {childAnalytics?.competencyProgress.reduce((a, b) => a + b.total, 0) || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Progress Charts and Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Weekly Progress Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Progression de la Semaine</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <TrendingUp className="w-4 h-4" />
                      <span>+12% vs semaine précédente</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {childAnalytics?.weeklyProgress.map((progress, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-12 text-sm text-gray-600 font-medium">
                          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][index]}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <motion.div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                          />
                        </div>
                        <div className="w-12 text-sm font-medium text-gray-900">{progress}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Achievements */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Récompenses Récentes</h3>
                  <div className="space-y-4">
                    {childAnalytics?.recentAchievements.map((achievement) => (
                      <motion.div
                        key={achievement.id}
                        className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                        whileHover={{ x: 4 }}
                      >
                        <div className={`w-10 h-10 ${achievement.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{achievement.title}</p>
                          <p className="text-gray-500 text-xs">
                            {new Date(achievement.date).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Competency Progress */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Progression par Domaine (CP2025)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {childAnalytics?.competencyProgress.map((competency, index) => (
                    <motion.div
                      key={competency.domain}
                      className="p-4 bg-gray-50 rounded-xl"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{competency.domain}</h4>
                        <span className="text-sm text-gray-600">{competency.mastered}/{competency.total}</span>
                      </div>
                      <div className="relative">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${competency.progress}%` }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                          />
                        </div>
                        <div className="mt-2 text-right">
                          <span className="text-sm font-medium text-gray-900">{competency.progress}%</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ParentDashboard;