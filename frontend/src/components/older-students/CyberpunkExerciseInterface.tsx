import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlitchParticleEngine from './GlitchParticleEngine';
import { 
  Zap, 
  Target, 
  CheckCircle, 
  XCircle, 
  Play, 
  Pause, 
  RotateCcw,
  Brain,
  Cpu,
  Database,
  Shield,
  Gamepad2
} from 'lucide-react';

interface Exercise {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

interface CyberpunkExerciseInterfaceProps {
  exercise: Exercise;
  onAnswer: (answer: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  currentQuestion: number;
  totalQuestions: number;
  timeRemaining?: number;
  isActive: boolean;
}

const CyberpunkExerciseInterface: React.FC<CyberpunkExerciseInterfaceProps> = ({
  exercise,
  onAnswer,
  onNext,
  onPrevious,
  currentQuestion,
  totalQuestions,
  timeRemaining,
  isActive
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [glitchIntensity, setGlitchIntensity] = useState<0 | 1 | 2 | 3 | 4 | 5>(2);

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

  // Difficulty colors
  const difficultyColors = {
    easy: '#00ff00', // Green
    medium: '#ffff00', // Yellow
    hard: '#ff0000' // Red
  };

  // Handle answer selection
  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return;
    
    setSelectedAnswer(answerIndex);
    const correct = answerIndex === exercise.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    
    // Trigger glitch effect based on correctness
    setGlitchIntensity(correct ? 4 : 1);
    
    // Call parent callback
    onAnswer(answerIndex);
  };

  // Handle next question
  const handleNext = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setGlitchIntensity(2);
    onNext();
  };

  // Handle previous question
  const handlePrevious = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setGlitchIntensity(2);
    onPrevious();
  };

  // Reset for new exercise
  useEffect(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setGlitchIntensity(2);
  }, [exercise.id]);

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
          particleCount={150}
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
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-cyan-400">
              NEURAL_TRAINING_MODULE
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-yellow-400" />
                <span className="text-sm">Q_{currentQuestion + 1}_{totalQuestions}</span>
              </div>
              {timeRemaining && (
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-red-400">{timeRemaining}s</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-800 rounded-full h-2 border border-cyan-400">
            <motion.div 
              className="h-full bg-gradient-to-r from-cyan-400 to-green-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>

        {/* Exercise Card */}
        <motion.div 
          className="bg-gray-900/80 border border-cyan-400 rounded-lg p-8 backdrop-blur-sm mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Exercise Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold text-cyan-400">NEURAL_QUERY</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">DIFFICULTY:</span>
              <span 
                className="px-3 py-1 rounded-full text-sm font-bold border"
                style={{ 
                  color: difficultyColors[exercise.difficulty],
                  borderColor: difficultyColors[exercise.difficulty]
                }}
              >
                {exercise.difficulty.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-4 leading-relaxed">
              {exercise.question}
            </h3>
            <div className="text-sm text-gray-400">
              CATEGORY: {exercise.category.toUpperCase()}
            </div>
          </div>

          {/* Answer Options */}
          <div className="space-y-4">
            {exercise.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectAnswer = index === exercise.correctAnswer;
              const showCorrect = showResult && isCorrectAnswer;
              const showIncorrect = showResult && isSelected && !isCorrectAnswer;

              return (
                <motion.button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showResult}
                  className={`w-full p-4 text-left border rounded-lg transition-all ${
                    showCorrect
                      ? 'border-green-400 bg-green-400/10 text-green-400'
                      : showIncorrect
                      ? 'border-red-400 bg-red-400/10 text-red-400'
                      : isSelected
                      ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                      : 'border-gray-600 bg-gray-800/50 text-white hover:border-cyan-400/50'
                  }`}
                  whileHover={!showResult ? { scale: 1.02 } : {}}
                  whileTap={!showResult ? { scale: 0.98 } : {}}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                      showCorrect
                        ? 'border-green-400 bg-green-400/20'
                        : showIncorrect
                        ? 'border-red-400 bg-red-400/20'
                        : isSelected
                        ? 'border-cyan-400 bg-cyan-400/20'
                        : 'border-gray-600 bg-gray-700'
                    }`}>
                      {showCorrect && <CheckCircle className="w-5 h-5 text-green-400" />}
                      {showIncorrect && <XCircle className="w-5 h-5 text-red-400" />}
                      {!showResult && <span className="text-sm font-bold">{String.fromCharCode(65 + index)}</span>}
                    </div>
                    <span className="text-lg">{option}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Result Display */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`mt-6 p-4 border rounded-lg ${
                  isCorrect
                    ? 'border-green-400 bg-green-400/10'
                    : 'border-red-400 bg-red-400/10'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {isCorrect ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400" />
                  )}
                  <h4 className={`text-lg font-bold ${
                    isCorrect ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {isCorrect ? 'NEURAL_PATTERN_RECOGNIZED' : 'NEURAL_PATTERN_ERROR'}
                  </h4>
                </div>
                <p className="text-white text-sm leading-relaxed">
                  {exercise.explanation}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation Controls */}
        <motion.div 
          className="flex justify-between items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 px-6 py-3 border border-gray-600 rounded-lg bg-gray-800/50 text-gray-400 hover:border-cyan-400/50 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            <span>PREVIOUS</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-sm text-green-400">NEURAL_SECURITY_ACTIVE</span>
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={!showResult}
            className="flex items-center gap-2 px-6 py-3 border border-cyan-400 rounded-lg bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span>NEXT</span>
            <Play className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default CyberpunkExerciseInterface;
