import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExerciseFeedbackSystem from './ExerciseFeedbackSystem';

// =============================================================================
// 🎯 ENHANCED EXERCISE INTERFACE - PERFECT ANIMATIONS + MASCOT REACTIONS
// =============================================================================

interface Exercise {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
}

interface EnhancedExerciseInterfaceProps {
  exercise: Exercise;
  studentName: string;
  studentData: {
    level: number;
    xp: number;
    currentStreak: number;
    recentPerformance: 'excellent' | 'struggling' | 'average';
    timeOfDay: 'morning' | 'afternoon' | 'evening';
  };
  onAnswer: (answerIndex: number, isCorrect: boolean) => void;
  onNext: () => void;
  onPrevious: () => void;
  currentQuestion: number;
  totalQuestions: number;
  timeRemaining?: number;
}

// Voice-over mapping for questions (Microsoft TTS pre-recorded files)
const QUESTION_VOICE_FILES: Record<string, string> = {
  // Map question text or ID to audio file path
  'question_1': '/voices/questions/question-1.mp3',
  'question_2': '/voices/questions/question-2.mp3',
  'question_3': '/voices/questions/question-3.mp3',
  // Fallback: try to match by question text (first 50 chars)
};

const EnhancedExerciseInterface: React.FC<EnhancedExerciseInterfaceProps> = ({
  exercise,
  studentName,
  studentData,
  onAnswer,
  onNext,
  onPrevious,
  currentQuestion,
  totalQuestions,
  timeRemaining
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answerAnimation, setAnswerAnimation] = useState<'none' | 'correct' | 'incorrect'>('none');
  
  // Voice-over state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  // Handle answer selection with perfect animations
  const handleAnswerSelect = useCallback((answerIndex: number) => {
    if (showResult) return;
    
    setSelectedAnswer(answerIndex);
    const correct = answerIndex === exercise.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    
    // Trigger immediate visual feedback
    setAnswerAnimation(correct ? 'correct' : 'incorrect');
    
    // Show feedback system for correct answers
    if (correct) {
      setShowFeedback(true);
      
      // Determine feedback type based on performance
      const isPerfect = Math.random() > 0.7; // 30% chance of perfect score
      const hasStreakBonus = studentData.currentStreak > 2;
      
      // Trigger the perfect feedback system
      setTimeout(() => {
        // @ts-ignore - Global function from ExerciseFeedbackSystem
        if (window.triggerCorrectAnswer) {
          window.triggerCorrectAnswer(isPerfect, hasStreakBonus);
        }
      }, 500);
    }
    
    // Call parent callback
    onAnswer(answerIndex, correct);
    
    // Auto-advance after showing result
    setTimeout(() => {
      setAnswerAnimation('none');
      setShowResult(false);
      setShowFeedback(false);
      setSelectedAnswer(null);
      onNext();
    }, correct ? 4000 : 2000);
  }, [exercise.correctAnswer, showResult, studentData.currentStreak, onAnswer, onNext]);

  // Reset for new exercise
  useEffect(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswerAnimation('none');
    setShowFeedback(false);
  }, [exercise.id]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 border-green-400';
      case 'medium': return 'text-yellow-400 border-yellow-400';
      case 'hard': return 'text-red-400 border-red-400';
      default: return 'text-blue-400 border-blue-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-6">
      {/* Exercise Feedback System */}
      {showFeedback && (
        <ExerciseFeedbackSystem
          studentName={studentName}
          studentData={studentData}
          onFeedbackComplete={() => setShowFeedback(false)}
          onMascotInteraction={(type) => console.log('Mascot interaction:', type)}
          onEmotionalStateChange={(state) => console.log('Emotional state:', state)}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <motion.button
            onClick={onPrevious}
            className="p-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:bg-white/20 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ←
          </motion.button>
          <div>
            <h2 className="text-2xl font-bold">Question {currentQuestion} sur {totalQuestions}</h2>
            <div className={`inline-block px-3 py-1 rounded-full border text-sm ${getDifficultyColor(exercise.difficulty)}`}>
              {exercise.difficulty.toUpperCase()}
            </div>
          </div>
        </div>
        
        {timeRemaining && (
          <div className="text-right">
            <div className="text-sm text-gray-300">Temps restant</div>
            <div className="text-2xl font-mono font-bold text-cyan-400">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}
      </div>

      {/* Question */}
      <motion.div
        className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold mb-4 text-center">{exercise.question}</h1>
        <div className="text-center text-gray-300 text-lg">{exercise.subject}</div>
      </motion.div>

      {/* Answer Options */}
      <div className="space-y-4 max-w-2xl mx-auto">
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
              className={`w-full p-6 text-left border-2 rounded-xl transition-all duration-300 ${
                showCorrect
                  ? 'border-green-400 bg-green-400/20 text-green-400 shadow-lg shadow-green-400/25'
                  : showIncorrect
                  ? 'border-red-400 bg-red-400/20 text-red-400 shadow-lg shadow-red-400/25'
                  : isSelected
                  ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400'
                  : 'border-white/30 bg-white/5 text-white hover:border-cyan-400/50 hover:bg-white/10'
              }`}
              whileHover={!showResult ? { scale: 1.02, y: -2 } : {}}
              whileTap={!showResult ? { scale: 0.98 } : {}}
              animate={
                answerAnimation === 'correct' && showCorrect
                  ? { scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }
                  : answerAnimation === 'incorrect' && showIncorrect
                  ? { x: [-5, 5, -5, 0] }
                  : {}
              }
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold ${
                  showCorrect
                    ? 'border-green-400 bg-green-400 text-white'
                    : showIncorrect
                    ? 'border-red-400 bg-red-400 text-white'
                    : 'border-white/50 bg-white/10'
                }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <div className="flex-1 text-lg">{option}</div>
                {showCorrect && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="text-2xl"
                  >
                    ✅
                  </motion.div>
                )}
                {showIncorrect && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="text-2xl"
                  >
                    ❌
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-12 max-w-2xl mx-auto">
        <div className="flex justify-between text-sm text-gray-300 mb-2">
          <span>Progrès</span>
          <span>{Math.round((currentQuestion / totalQuestions) * 100)}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentQuestion / totalQuestions) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedExerciseInterface;

