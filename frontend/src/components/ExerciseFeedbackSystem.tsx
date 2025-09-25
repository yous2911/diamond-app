import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CelebrationSystem from './CelebrationSystem';
import MascotSystem from './MascotSystem';
import AdvancedParticleEngine from './AdvancedParticleEngine';
import { useMagicalSounds } from '../hooks/useMagicalSounds';
import { useVoiceSystem } from '../hooks/useVoiceSystem';

// =============================================================================
// 🎯 PERFECT ANSWER FEEDBACK SYSTEM - CONNECTS EVERYTHING
// =============================================================================

interface ExerciseFeedbackSystemProps {
  studentName: string;
  studentData: {
    level: number;
    xp: number;
    currentStreak: number;
    recentPerformance: 'excellent' | 'struggling' | 'average';
    timeOfDay: 'morning' | 'afternoon' | 'evening';
  };
  onFeedbackComplete: () => void;
  onMascotInteraction: (type: string) => void;
  onEmotionalStateChange: (state: any) => void;
}

interface FeedbackState {
  type: 'exercise_complete' | 'perfect_score' | 'streak' | 'level_up' | null;
  showCelebration: boolean;
  showMascotReaction: boolean;
  particleEffect: boolean;
  data?: any;
}

const ExerciseFeedbackSystem: React.FC<ExerciseFeedbackSystemProps> = ({
  studentName,
  studentData,
  onFeedbackComplete,
  onMascotInteraction,
  onEmotionalStateChange
}) => {
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    type: null,
    showCelebration: false,
    showMascotReaction: false,
    particleEffect: false
  });

  const {
    playCorrectAnswer,
    playPerfectScore,
    playLevelUp,
    playStreakBonus,
    playMascotHappy,
    playMascotExcited,
    playParticleMagic,
    playParticleCrystal
  } = useMagicalSounds();

  const {
    playCorrectAnswer: playVoiceCorrect,
    playPerfectScore: playVoicePerfect,
    playLevelUp: playVoiceLevelUp,
    playStreakBonus: playVoiceStreak,
    playMascotMood,
    preloadVoices
  } = useVoiceSystem();

  // Trigger perfect answer feedback
  const triggerCorrectAnswer = useCallback((isPerfect: boolean = false, streakBonus: boolean = false) => {
    const feedbackType = isPerfect ? 'perfect_score' : streakBonus ? 'streak' : 'exercise_complete';
    
    // Play appropriate sound effects + voice
    if (isPerfect) {
      playPerfectScore();
      playVoicePerfect();
      playMascotExcited();
      playParticleCrystal();
    } else if (streakBonus) {
      playStreakBonus();
      playVoiceStreak();
      playMascotHappy();
      playParticleMagic();
    } else {
      playCorrectAnswer();
      playVoiceCorrect();
      playMascotHappy();
      playParticleMagic();
    }
    
    setFeedbackState({
      type: feedbackType,
      showCelebration: true,
      showMascotReaction: true,
      particleEffect: true,
      data: {
        score: isPerfect ? 100 : 85,
        streakCount: studentData.currentStreak,
        xpGained: isPerfect ? 50 : 25,
        enhanced: isPerfect
      }
    });

    // Auto-complete after celebration
    setTimeout(() => {
      setFeedbackState(prev => ({ ...prev, showCelebration: false }));
      setTimeout(() => {
        setFeedbackState(prev => ({ ...prev, showMascotReaction: false, particleEffect: false }));
        onFeedbackComplete();
      }, 2000);
    }, 3000);
  }, [studentData.currentStreak, onFeedbackComplete, playCorrectAnswer, playPerfectScore, playStreakBonus, playMascotHappy, playMascotExcited, playParticleMagic, playParticleCrystal]);

  // Trigger level up feedback
  const triggerLevelUp = useCallback((newLevel: number) => {
    // Play epic level up sounds + voice
    playLevelUp();
    playVoiceLevelUp();
    playMascotExcited();
    playParticleCrystal();
    
    setFeedbackState({
      type: 'level_up',
      showCelebration: true,
      showMascotReaction: true,
      particleEffect: true,
      data: {
        newLevel,
        xpGained: 100,
        enhanced: true
      }
    });

    setTimeout(() => {
      setFeedbackState(prev => ({ ...prev, showCelebration: false }));
      setTimeout(() => {
        setFeedbackState(prev => ({ ...prev, showMascotReaction: false, particleEffect: false }));
        onFeedbackComplete();
      }, 2000);
    }, 4000);
  }, [onFeedbackComplete, playLevelUp, playMascotExcited, playParticleCrystal]);

  // Expose methods for parent components
  useEffect(() => {
    // @ts-ignore - Adding to window for global access
    window.triggerCorrectAnswer = triggerCorrectAnswer;
    // @ts-ignore
    window.triggerLevelUp = triggerLevelUp;
  }, [triggerCorrectAnswer, triggerLevelUp]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Celebration System */}
      <AnimatePresence>
        {feedbackState.showCelebration && feedbackState.type && (
          <CelebrationSystem
            type={feedbackState.type}
            studentName={studentName}
            data={feedbackState.data}
            onComplete={() => setFeedbackState(prev => ({ ...prev, showCelebration: false }))}
          />
        )}
      </AnimatePresence>

      {/* Mascot Reaction */}
      <AnimatePresence>
        {feedbackState.showMascotReaction && (
          <motion.div
            className="absolute top-4 right-4 pointer-events-auto"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <MascotSystem
              locale="fr"
              mascotType="dragon"
              studentData={{
                ...studentData,
                recentPerformance: feedbackState.type === 'perfect_score' ? 'excellent' : 'average'
              }}
              currentActivity={feedbackState.type === 'level_up' ? 'achievement' : 'exercise'}
              equippedItems={[]}
              onMascotInteraction={onMascotInteraction}
              onEmotionalStateChange={onEmotionalStateChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Particle Effects */}
      <AnimatePresence>
        {feedbackState.particleEffect && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AdvancedParticleEngine
              isActive={true}
              intensity={5}
              particleType={feedbackState.type === 'perfect_score' ? 'crystal' : 'magic'}
              particleCount={feedbackState.type === 'perfect_score' ? 100 : 50}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExerciseFeedbackSystem;
