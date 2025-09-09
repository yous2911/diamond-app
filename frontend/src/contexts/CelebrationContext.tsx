import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import CelebrationSystem from '../components/CelebrationSystem';
import { useAuth } from './AuthContext';

// =============================================================================
// 🎉 GLOBAL CELEBRATION CONTEXT - MEMORABLE MOMENTS EVERYWHERE
// =============================================================================

type CelebrationType = 
  | 'exercise_complete' 
  | 'level_up' 
  | 'streak' 
  | 'first_time' 
  | 'perfect_score' 
  | 'comeback'
  | 'milestone'
  | 'achievement_unlocked'
  | 'daily_goal'
  | 'weekly_champion';

interface CelebrationData {
  score?: number;
  newLevel?: number;
  streakCount?: number;
  xpGained?: number;
  timeSpent?: number;
  difficulty?: string;
  milestone?: string;
  achievement?: string;
  context?: string;
}

interface CelebrationState {
  show: boolean;
  type: CelebrationType;
  data: CelebrationData;
  queue: Array<{ type: CelebrationType; data: CelebrationData }>;
}

interface CelebrationContextType {
  // Trigger celebrations
  celebrate: (type: CelebrationType, data?: CelebrationData) => void;
  
  // Smart celebration detection
  checkForCelebrations: (exerciseResult: any, studentStats: any) => void;
  
  // Queue management
  queueCelebration: (type: CelebrationType, data?: CelebrationData) => void;
  clearQueue: () => void;
  
  // State
  iscelebrating: boolean;
  currentCelebration: CelebrationState;
}

const CelebrationContext = createContext<CelebrationContextType | undefined>(undefined);

export const useCelebrations = () => {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebrations must be used within CelebrationProvider');
  }
  return context;
};

interface CelebrationProviderProps {
  children: ReactNode;
}

export const CelebrationProvider: React.FC<CelebrationProviderProps> = ({ children }) => {
  const { student } = useAuth();
  const [celebrationState, setCelebrationState] = useState<CelebrationState>({
    show: false,
    type: 'exercise_complete',
    data: {},
    queue: []
  });

  // Smart celebration detection based on context and achievements
  const detectCelebrationContext = useCallback((type: CelebrationType, data: CelebrationData = {}) => {
    const detections = {
      exercise_complete: () => {
        // Enhance based on performance
        if (data.score === 100 && data.timeSpent && data.timeSpent < 30) {
          return { type: 'perfect_score' as CelebrationType, enhanced: true };
        }
        if (data.difficulty === 'Difficile' && data.score && data.score >= 80) {
          return { type: 'comeback' as CelebrationType, enhanced: true };
        }
        return { type, enhanced: false };
      },
      
      level_up: () => {
        // Level milestones
        if (data.newLevel && [5, 10, 15, 20].includes(data.newLevel)) {
          return { type: 'milestone' as CelebrationType, enhanced: true };
        }
        return { type, enhanced: false };
      },
      
      streak: () => {
        // Special streak milestones
        if (data.streakCount && data.streakCount % 10 === 0) {
          return { type: 'achievement_unlocked' as CelebrationType, enhanced: true };
        }
        return { type, enhanced: false };
      }
    };
    
    const detector = detections[type as keyof typeof detections];
    return detector ? detector() : { type, enhanced: false };
  }, []);

  // Queue celebrations to avoid overlapping
  const queueCelebration = useCallback((type: CelebrationType, data: CelebrationData = {}) => {
    setCelebrationState(prev => ({
      ...prev,
      queue: [...prev.queue, { type, data }]
    }));
    
    // Process queue if not currently celebrating
    if (!celebrationState.show) {
      processQueue();
    }
  }, [celebrationState.show]);

  // Process celebration queue
  const processQueue = useCallback(() => {
    setCelebrationState(prev => {
      if (prev.queue.length === 0 || prev.show) return prev;
      
      const [nextCelebration, ...remainingQueue] = prev.queue;
      const contextual = detectCelebrationContext(nextCelebration.type, nextCelebration.data);
      
      return {
        ...prev,
        show: true,
        type: contextual.type,
        data: {
          ...nextCelebration.data,
          enhanced: contextual.enhanced
        },
        queue: remainingQueue
      };
    });
  }, [detectCelebrationContext]);

  // Main celebration trigger
  const celebrate = useCallback((type: CelebrationType, data: CelebrationData = {}) => {
    console.log(`🎉 Triggering celebration: ${type}`, data);
    
    if (celebrationState.show) {
      // Queue if currently celebrating
      queueCelebration(type, data);
    } else {
      // Immediate celebration
      const contextual = detectCelebrationContext(type, data);
      setCelebrationState(prev => ({
        ...prev,
        show: true,
        type: contextual.type,
        data: {
          ...data,
          enhanced: contextual.enhanced
        }
      }));
    }
  }, [celebrationState.show, queueCelebration, detectCelebrationContext]);

  // Smart detection for exercise results
  const checkForCelebrations = useCallback((exerciseResult: any, studentStats: any) => {
    const { score, timeSpent, difficulty, isCorrect, streakBefore, streakAfter } = exerciseResult;
    const { totalExercises, correctAnswers, currentLevel, previousLevel } = studentStats;
    
    // Level up detection
    if (currentLevel > previousLevel) {
      celebrate('level_up', {
        newLevel: currentLevel,
        xpGained: exerciseResult.xpGained
      });
      return;
    }
    
    // Streak detection
    if (streakAfter > streakBefore && streakAfter >= 3) {
      celebrate('streak', {
        streakCount: streakAfter,
        xpGained: exerciseResult.xpGained
      });
      return;
    }
    
    // Perfect score detection
    if (score === 100 && difficulty === 'Difficile') {
      celebrate('perfect_score', {
        score,
        timeSpent,
        difficulty,
        xpGained: exerciseResult.xpGained
      });
      return;
    }
    
    // Comeback detection (after previous failures)
    if (isCorrect && streakBefore === 0 && score >= 80) {
      celebrate('comeback', {
        score,
        xpGained: exerciseResult.xpGained
      });
      return;
    }
    
    // First time detection
    if (totalExercises === 1) {
      celebrate('first_time', {
        score,
        xpGained: exerciseResult.xpGained
      });
      return;
    }
    
    // Milestone detection
    if ([10, 25, 50, 100, 200].includes(correctAnswers)) {
      celebrate('milestone', {
        milestone: `${correctAnswers} exercices réussis !`,
        xpGained: exerciseResult.xpGained
      });
      return;
    }
    
    // Daily goal detection (placeholder for future implementation)
    const today = new Date().toDateString();
    const dailyExercises = 10; // This would come from user stats
    if (dailyExercises >= 10) {
      celebrate('daily_goal', {
        achievement: 'Objectif quotidien atteint !',
        xpGained: exerciseResult.xpGained
      });
      return;
    }
    
    // Default exercise completion
    if (isCorrect) {
      celebrate('exercise_complete', {
        score,
        timeSpent,
        difficulty,
        xpGained: exerciseResult.xpGained
      });
    }
  }, [celebrate]);

  // Handle celebration completion
  const handleCelebrationComplete = useCallback(() => {
    setCelebrationState(prev => ({
      ...prev,
      show: false
    }));
    
    // Process next in queue after a brief delay
    setTimeout(() => {
      processQueue();
    }, 500);
  }, [processQueue]);

  // Clear queue
  const clearQueue = useCallback(() => {
    setCelebrationState(prev => ({
      ...prev,
      queue: []
    }));
  }, []);

  const contextValue: CelebrationContextType = {
    celebrate,
    checkForCelebrations,
    queueCelebration,
    clearQueue,
    iscelebrating: celebrationState.show,
    currentCelebration: celebrationState
  };

  return (
    <CelebrationContext.Provider value={contextValue}>
      {children}
      
      {/* Global celebration overlay */}
      <AnimatePresence>
        {celebrationState.show && (
          <CelebrationSystem
            type={celebrationState.type}
            studentName={student?.prenom || 'Élève'}
            data={celebrationState.data}
            onComplete={handleCelebrationComplete}
          />
        )}
      </AnimatePresence>
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && celebrationState.queue.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded backdrop-blur-sm z-50">
          <div>Queue: {celebrationState.queue.length}</div>
          <div>Current: {celebrationState.show ? celebrationState.type : 'none'}</div>
        </div>
      )}
    </CelebrationContext.Provider>
  );
};

export default CelebrationContext;