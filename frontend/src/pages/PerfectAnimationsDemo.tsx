import React, { useState } from 'react';
import { motion } from 'framer-motion';
import EnhancedExerciseInterface from '../components/EnhancedExerciseInterface';
import ExerciseFeedbackSystem from '../components/ExerciseFeedbackSystem';

// =============================================================================
// 🎯 PERFECT ANIMATIONS DEMO - SHOWCASE YOUR AMAZING SYSTEM
// =============================================================================

const PerfectAnimationsDemo: React.FC = () => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'correct' | 'perfect' | 'streak' | 'levelup' | null>(null);

  const demoExercises = [
    {
      id: '1',
      question: 'Combien font 5 + 3 ?',
      options: ['6', '7', '8', '9'],
      correctAnswer: 2,
      difficulty: 'easy' as const,
      subject: 'Mathématiques'
    },
    {
      id: '2',
      question: 'Quel est le pluriel de "cheval" ?',
      options: ['chevals', 'chevaux', 'chevales', 'cheval'],
      correctAnswer: 1,
      difficulty: 'medium' as const,
      subject: 'Français'
    },
    {
      id: '3',
      question: 'Quelle est la capitale de la France ?',
      options: ['Lyon', 'Marseille', 'Paris', 'Toulouse'],
      correctAnswer: 2,
      difficulty: 'easy' as const,
      subject: 'Géographie'
    }
  ];

  const studentData = {
    level: 5,
    xp: 1250,
    currentStreak: 7,
    recentPerformance: 'excellent' as const,
    timeOfDay: 'afternoon' as const
  };

  const handleAnswer = (answerIndex: number, isCorrect: boolean) => {
    console.log('Answer selected:', answerIndex, 'Correct:', isCorrect);
  };

  const handleNext = () => {
    setCurrentExercise((prev) => (prev + 1) % demoExercises.length);
  };

  const handlePrevious = () => {
    setCurrentExercise((prev) => (prev - 1 + demoExercises.length) % demoExercises.length);
  };

  const triggerDemo = (type: 'correct' | 'perfect' | 'streak' | 'levelup') => {
    setFeedbackType(type);
    setShowFeedback(true);
    
    // Trigger the appropriate feedback
    setTimeout(() => {
      // @ts-ignore - Global function from ExerciseFeedbackSystem
      if (window.triggerCorrectAnswer) {
        switch (type) {
          case 'correct':
            window.triggerCorrectAnswer(false, false);
            break;
          case 'perfect':
            window.triggerCorrectAnswer(true, false);
            break;
          case 'streak':
            window.triggerCorrectAnswer(false, true);
            break;
          case 'levelup':
            // @ts-ignore
            if (window.triggerLevelUp) {
              window.triggerLevelUp(6);
            }
            break;
        }
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Demo Controls */}
      <div className="fixed top-4 left-4 z-50 bg-black/50 backdrop-blur-sm rounded-lg p-4 border border-white/20">
        <h3 className="text-lg font-bold mb-4">🎯 Perfect Animations Demo</h3>
        <div className="space-y-2">
          <button
            onClick={() => triggerDemo('correct')}
            className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
          >
            ✅ Correct Answer
          </button>
          <button
            onClick={() => triggerDemo('perfect')}
            className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg transition-colors"
          >
            💯 Perfect Score
          </button>
          <button
            onClick={() => triggerDemo('streak')}
            className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
          >
            🔥 Streak Bonus
          </button>
          <button
            onClick={() => triggerDemo('levelup')}
            className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
          >
            🚀 Level Up
          </button>
        </div>
      </div>

      {/* Exercise Interface */}
      <EnhancedExerciseInterface
        exercise={demoExercises[currentExercise]}
        studentName="Alice"
        studentData={studentData}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onPrevious={handlePrevious}
        currentQuestion={currentExercise + 1}
        totalQuestions={demoExercises.length}
        timeRemaining={120}
      />

      {/* Feedback System */}
      {showFeedback && (
        <ExerciseFeedbackSystem
          studentName="Alice"
          studentData={studentData}
          onFeedbackComplete={() => {
            setShowFeedback(false);
            setFeedbackType(null);
          }}
          onMascotInteraction={(type) => console.log('Mascot interaction:', type)}
          onEmotionalStateChange={(state) => console.log('Emotional state:', state)}
        />
      )}

      {/* Info Panel */}
      <div className="fixed bottom-4 right-4 z-50 bg-black/50 backdrop-blur-sm rounded-lg p-4 border border-white/20 max-w-sm">
        <h4 className="font-bold mb-2">🎉 What You Get:</h4>
        <ul className="text-sm space-y-1">
          <li>✨ Instant particle effects</li>
          <li>🎭 Mascot reactions & dialogue</li>
          <li>🎵 Magical sound effects</li>
          <li>🎊 Celebration animations</li>
          <li>🌟 Perfect score bonuses</li>
          <li>🔥 Streak celebrations</li>
          <li>🚀 Level up sequences</li>
        </ul>
        <div className="mt-3 text-xs text-gray-300">
          Click the buttons to see each animation!
        </div>
      </div>
    </div>
  );
};

export default PerfectAnimationsDemo;

