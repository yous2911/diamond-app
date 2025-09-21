import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlitchParticleEngine from './GlitchParticleEngine';
import { 
  Zap, 
  Target, 
  Trophy, 
  TrendingUp, 
  Brain, 
  Code, 
  Shield,
  Gamepad2,
  Cpu,
  Database
} from 'lucide-react';

interface CyberpunkDashboardProps {
  studentData: {
    name: string;
    level: number;
    xp: number;
    xpToNext: number;
    streak: number;
    achievements: number;
    rank: number;
    totalStudents: number;
  };
  isActive: boolean;
}

const CyberpunkDashboard: React.FC<CyberpunkDashboardProps> = ({ 
  studentData, 
  isActive 
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'leaderboard'>('stats');
  const [glitchIntensity, setGlitchIntensity] = useState<0 | 1 | 2 | 3 | 4 | 5>(3);

  // Calculate progress percentage
  const progressPercentage = (studentData.xp / (studentData.xp + studentData.xpToNext)) * 100;

  // Cyberpunk color scheme
  const colors = {
    primary: '#00ffff', // Cyan
    secondary: '#ff00ff', // Magenta
    accent: '#ffff00', // Yellow
    success: '#00ff00', // Green
    warning: '#ff8000', // Orange
    danger: '#ff0000', // Red
    dark: '#0a0a0a', // Dark background
    light: '#ffffff' // White text
  };

  // Tab data
  const tabs = [
    { id: 'stats', label: 'NEURAL_STATS', icon: Brain },
    { id: 'achievements', label: 'ACHIEVEMENTS', icon: Trophy },
    { id: 'leaderboard', label: 'RANKINGS', icon: TrendingUp }
  ];

  // Achievement data
  const achievements = [
    { id: 1, name: 'FIRST_BOOT', description: 'Complete first exercise', unlocked: true, icon: Zap },
    { id: 2, name: 'STREAK_MASTER', description: '7 day streak', unlocked: studentData.streak >= 7, icon: Target },
    { id: 3, name: 'LEVEL_HACKER', description: 'Reach level 10', unlocked: studentData.level >= 10, icon: Code },
    { id: 4, name: 'NEURAL_NETWORK', description: 'Complete 100 exercises', unlocked: false, icon: Cpu },
    { id: 5, name: 'DATA_MASTER', description: 'Perfect score streak', unlocked: false, icon: Database }
  ];

  // Leaderboard data (mock)
  const leaderboard = [
    { rank: 1, name: 'CYBER_STUDENT_01', xp: 2500, level: 15 },
    { rank: 2, name: 'NEURAL_HACKER', xp: 2300, level: 14 },
    { rank: 3, name: 'DATA_MASTER', xp: 2100, level: 13 },
    { rank: studentData.rank, name: studentData.name, xp: studentData.xp, level: studentData.level, isCurrent: true },
    { rank: 5, name: 'CODE_BREAKER', xp: 1800, level: 12 }
  ];

  return (
    <div className="relative min-h-screen bg-black text-cyan-400 font-mono overflow-hidden">
      {/* Background Particle System */}
      <div className="absolute inset-0 z-0">
        <GlitchParticleEngine
          width={window.innerWidth}
          height={window.innerHeight}
          particleType="glitch"
          behavior="glitch"
          intensity={glitchIntensity}
          isActive={isActive}
          particleCount={200}
          enableTrails={true}
          enablePhysics={true}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">
            NEURAL_INTERFACE_ACTIVE
          </h1>
          <p className="text-green-400 text-lg">
            Welcome back, {studentData.name.toUpperCase()}
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-yellow-400" />
              <span className="text-sm">LEVEL_{studentData.level}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-magenta-400" />
              <span className="text-sm">XP_{studentData.xp}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" />
              <span className="text-sm">STREAK_{studentData.streak}_DAYS</span>
            </div>
          </div>
        </motion.div>

        {/* XP Progress Bar */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="bg-gray-900 border border-cyan-400 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-cyan-400 font-bold">NEURAL_PROGRESS</span>
              <span className="text-green-400">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-4 border border-cyan-400">
              <motion.div 
                className="h-full bg-gradient-to-r from-cyan-400 to-green-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-400">CURRENT_XP: {studentData.xp}</span>
              <span className="text-gray-400">NEXT_LEVEL: {studentData.xpToNext}</span>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                      : 'border-gray-600 bg-gray-800/50 text-gray-400 hover:border-cyan-400/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-mono">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900/80 border border-cyan-400 rounded-lg p-6 backdrop-blur-sm"
          >
            {activeTab === 'stats' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-800 border border-green-400 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Brain className="w-6 h-6 text-green-400" />
                    <h3 className="text-green-400 font-bold">NEURAL_ACTIVITY</h3>
                  </div>
                  <div className="text-2xl font-bold text-white">{studentData.level}</div>
                  <div className="text-sm text-gray-400">Current Level</div>
                </div>

                <div className="bg-gray-800 border border-yellow-400 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="w-6 h-6 text-yellow-400" />
                    <h3 className="text-yellow-400 font-bold">ENERGY_CORE</h3>
                  </div>
                  <div className="text-2xl font-bold text-white">{studentData.xp}</div>
                  <div className="text-sm text-gray-400">Total XP</div>
                </div>

                <div className="bg-gray-800 border border-magenta-400 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="w-6 h-6 text-magenta-400" />
                    <h3 className="text-magenta-400 font-bold">STREAK_PROTOCOL</h3>
                  </div>
                  <div className="text-2xl font-bold text-white">{studentData.streak}</div>
                  <div className="text-sm text-gray-400">Days Active</div>
                </div>

                <div className="bg-gray-800 border border-cyan-400 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Trophy className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-cyan-400 font-bold">ACHIEVEMENTS</h3>
                  </div>
                  <div className="text-2xl font-bold text-white">{studentData.achievements}</div>
                  <div className="text-sm text-gray-400">Unlocked</div>
                </div>

                <div className="bg-gray-800 border border-orange-400 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingUp className="w-6 h-6 text-orange-400" />
                    <h3 className="text-orange-400 font-bold">RANKING</h3>
                  </div>
                  <div className="text-2xl font-bold text-white">#{studentData.rank}</div>
                  <div className="text-sm text-gray-400">of {studentData.totalStudents}</div>
                </div>

                <div className="bg-gray-800 border border-red-400 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-6 h-6 text-red-400" />
                    <h3 className="text-red-400 font-bold">SECURITY_STATUS</h3>
                  </div>
                  <div className="text-2xl font-bold text-green-400">SECURE</div>
                  <div className="text-sm text-gray-400">All Systems Online</div>
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-cyan-400 mb-4">ACHIEVEMENT_MATRIX</h3>
                {achievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <motion.div
                      key={achievement.id}
                      className={`flex items-center gap-4 p-4 border rounded-lg ${
                        achievement.unlocked
                          ? 'border-green-400 bg-green-400/10'
                          : 'border-gray-600 bg-gray-800/50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className={`p-2 rounded-lg ${
                        achievement.unlocked ? 'bg-green-400/20' : 'bg-gray-700'
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          achievement.unlocked ? 'text-green-400' : 'text-gray-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold ${
                          achievement.unlocked ? 'text-green-400' : 'text-gray-400'
                        }`}>
                          {achievement.name}
                        </h4>
                        <p className="text-sm text-gray-400">{achievement.description}</p>
                      </div>
                      {achievement.unlocked && (
                        <div className="text-green-400 font-bold">UNLOCKED</div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-cyan-400 mb-4">NEURAL_RANKINGS</h3>
                <div className="space-y-2">
                  {leaderboard.map((student, index) => (
                    <motion.div
                      key={index}
                      className={`flex items-center gap-4 p-4 border rounded-lg ${
                        student.isCurrent
                          ? 'border-cyan-400 bg-cyan-400/10'
                          : 'border-gray-600 bg-gray-800/50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-2xl font-bold text-cyan-400">
                        #{student.rank}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold ${
                          student.isCurrent ? 'text-cyan-400' : 'text-white'
                        }`}>
                          {student.name}
                        </h4>
                        <p className="text-sm text-gray-400">
                          Level {student.level} • {student.xp} XP
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold">{student.xp}</div>
                        <div className="text-xs text-gray-400">XP</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CyberpunkDashboard;
