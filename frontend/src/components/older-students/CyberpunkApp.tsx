import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CyberpunkDashboard from './CyberpunkDashboard';
import CyberpunkExerciseInterface from './CyberpunkExerciseInterface';
import GlitchParticleEngine from './GlitchParticleEngine';
import { 
  Zap, 
  Brain, 
  Gamepad2, 
  Settings, 
  LogOut,
  User,
  Trophy,
  Target
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  streak: number;
  achievements: number;
  rank: number;
  totalStudents: number;
}

interface Exercise {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

const CyberpunkApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'exercise' | 'profile'>('dashboard');
  const [isActive, setIsActive] = useState(true);
  const [student, setStudent] = useState<Student>({
    id: '1',
    name: 'Alex',
    level: 8,
    xp: 1250,
    xpToNext: 250,
    streak: 12,
    achievements: 15,
    rank: 4,
    totalStudents: 150
  });

  // Mock exercise data
  const [currentExercise, setCurrentExercise] = useState<Exercise>({
    id: '1',
    question: 'What is the time complexity of binary search?',
    options: [
      'O(n)',
      'O(log n)',
      'O(n²)',
      'O(1)'
    ],
    correctAnswer: 1,
    explanation: 'Binary search has O(log n) time complexity because it eliminates half of the search space with each comparison.',
    difficulty: 'medium',
    category: 'Algorithms'
  });

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [totalQuestions] = useState(10);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: Brain },
    { id: 'exercise', label: 'TRAINING', icon: Gamepad2 },
    { id: 'profile', label: 'PROFILE', icon: User }
  ];

  // Handle exercise answer
  const handleExerciseAnswer = (answerIndex: number) => {
    const isCorrect = answerIndex === currentExercise.correctAnswer;
    
    if (isCorrect) {
      // Award XP
      setStudent(prev => ({
        ...prev,
        xp: prev.xp + 50,
        xpToNext: Math.max(0, prev.xpToNext - 50)
      }));
    }
  };

  // Handle next exercise
  const handleNextExercise = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1);
      // In a real app, you'd load the next exercise here
      setTimeRemaining(30); // Reset timer
    } else {
      // Exercise session complete
      setCurrentView('dashboard');
    }
  };

  // Handle previous exercise
  const handlePreviousExercise = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setTimeRemaining(30);
    }
  };

  // Timer effect
  useEffect(() => {
    if (timeRemaining && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev ? prev - 1 : null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining]);

  // Start exercise session
  const startExercise = () => {
    setCurrentView('exercise');
    setCurrentQuestion(0);
    setTimeRemaining(30);
  };

  return (
    <div className="relative min-h-screen bg-black text-cyan-400 font-mono overflow-hidden">
      {/* Background Particle System */}
      <div className="absolute inset-0 z-0">
        <GlitchParticleEngine
          width={window.innerWidth}
          height={window.innerHeight}
          particleType="glitch"
          behavior="glitch"
          intensity={3}
          isActive={isActive}
          particleCount={100}
          enableTrails={true}
          enablePhysics={true}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex h-screen">
        {/* Sidebar Navigation */}
        <motion.div 
          className="w-64 bg-gray-900/80 border-r border-cyan-400 backdrop-blur-sm"
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo/Header */}
          <div className="p-6 border-b border-cyan-400">
            <h1 className="text-2xl font-bold text-cyan-400">
              NEURAL_ED
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Advanced Learning Interface
            </p>
          </div>

          {/* Navigation */}
          <nav className="p-4">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      currentView === item.id
                        ? 'bg-cyan-400/20 border border-cyan-400 text-cyan-400'
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-cyan-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-mono">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Quick Stats */}
          <div className="p-4 border-t border-gray-700">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-400">Level {student.level}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-400">{student.streak} day streak</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-magenta-400" />
                <span className="text-sm text-gray-400">#{student.rank} rank</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={startExercise}
              className="w-full flex items-center gap-2 px-4 py-3 bg-green-400/20 border border-green-400 rounded-lg text-green-400 hover:bg-green-400/30 transition-all"
            >
              <Gamepad2 className="w-4 h-4" />
              <span className="text-sm font-mono">START_TRAINING</span>
            </button>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {currentView === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <CyberpunkDashboard 
                  studentData={student} 
                  isActive={isActive}
                />
              </motion.div>
            )}

            {currentView === 'exercise' && (
              <motion.div
                key="exercise"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <CyberpunkExerciseInterface
                  exercise={currentExercise}
                  onAnswer={handleExerciseAnswer}
                  onNext={handleNextExercise}
                  onPrevious={handlePreviousExercise}
                  currentQuestion={currentQuestion}
                  totalQuestions={totalQuestions}
                  timeRemaining={timeRemaining || undefined}
                  isActive={isActive}
                />
              </motion.div>
            )}

            {currentView === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full p-6"
              >
                <div className="bg-gray-900/80 border border-cyan-400 rounded-lg p-8 backdrop-blur-sm">
                  <h2 className="text-3xl font-bold text-cyan-400 mb-6">
                    NEURAL_PROFILE
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-gray-800 border border-green-400 rounded-lg p-4">
                        <h3 className="text-green-400 font-bold mb-2">USER_ID</h3>
                        <p className="text-white">{student.id}</p>
                      </div>
                      <div className="bg-gray-800 border border-yellow-400 rounded-lg p-4">
                        <h3 className="text-yellow-400 font-bold mb-2">NEURAL_NAME</h3>
                        <p className="text-white">{student.name}</p>
                      </div>
                      <div className="bg-gray-800 border border-magenta-400 rounded-lg p-4">
                        <h3 className="text-magenta-400 font-bold mb-2">SECURITY_LEVEL</h3>
                        <p className="text-white">ADVANCED</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gray-800 border border-cyan-400 rounded-lg p-4">
                        <h3 className="text-cyan-400 font-bold mb-2">SYSTEM_STATUS</h3>
                        <p className="text-green-400">ONLINE</p>
                      </div>
                      <div className="bg-gray-800 border border-orange-400 rounded-lg p-4">
                        <h3 className="text-orange-400 font-bold mb-2">LAST_ACTIVITY</h3>
                        <p className="text-white">2 minutes ago</p>
                      </div>
                      <div className="bg-gray-800 border border-red-400 rounded-lg p-4">
                        <h3 className="text-red-400 font-bold mb-2">NEURAL_SECURITY</h3>
                        <p className="text-green-400">SECURE</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CyberpunkApp;
