import React, { useCallback, useEffect, useState, memo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useGPUPerformance } from '../hooks/useGPUPerformance';
import MicroInteraction from './MicroInteractions';

// =============================================================================
// 🎉 CONTEXTUAL CELEBRATION SYSTEM - MEMORABLE SUCCESS MOMENTS
// =============================================================================

interface CelebrationProps {
  type: 'exercise_complete' | 'level_up' | 'streak' | 'first_time' | 'perfect_score' | 'comeback' | 'milestone' | 'achievement_unlocked' | 'daily_goal' | 'weekly_champion';
  studentName: string;
  data?: {
    score?: number;
    newLevel?: number;
    streakCount?: number;
    xpGained?: number;
    timeSpent?: number;
    difficulty?: string;
    milestone?: string;
    achievement?: string;
    enhanced?: boolean;
  };
  onComplete: () => void;
}

const CelebrationSystem = memo<CelebrationProps>(({ 
  type, 
  studentName, 
  data = {}, 
  onComplete 
}) => {
  const [phase, setPhase] = useState<'enter' | 'celebrate' | 'reward' | 'exit'>('enter');
  const [showConfetti, setShowConfetti] = useState(false);
  
  const { 
    getOptimalDuration, 
    getOptimalParticleCount, 
    shouldUseComplexAnimation,
    performanceTier 
  } = useGPUPerformance();
  
  const mainControls = useAnimation();
  const textControls = useAnimation();

  // Celebration configurations based on type
  const celebrations = {
    exercise_complete: {
      emoji: '🎯',
      title: 'Excellent travail !',
      message: `Tu as réussi cet exercice, ${studentName} !`,
      color: 'from-green-400 to-emerald-500',
      particleColor: 'bg-green-400',
      sound: 'success',
      duration: 2000
    },
    level_up: {
      emoji: '🚀',
      title: 'NIVEAU SUPÉRIEUR !',
      message: `Félicitations ${studentName} ! Tu es maintenant niveau ${data.newLevel} !`,
      color: 'from-purple-500 to-pink-500',
      particleColor: 'bg-purple-400',
      sound: 'levelup',
      duration: 4000
    },
    streak: {
      emoji: '🔥',
      title: `${data.streakCount} de suite !`,
      message: `Tu es en feu, ${studentName} ! Continue comme ça !`,
      color: 'from-orange-400 to-red-500',
      particleColor: 'bg-orange-400',
      sound: 'streak',
      duration: 2500
    },
    first_time: {
      emoji: '🌟',
      title: 'Première fois !',
      message: `Bravo ${studentName} ! Tu as découvert quelque chose de nouveau !`,
      color: 'from-yellow-400 to-orange-500',
      particleColor: 'bg-yellow-400',
      sound: 'discovery',
      duration: 3000
    },
    perfect_score: {
      emoji: '💯',
      title: 'SCORE PARFAIT !',
      message: `Incroyable ${studentName} ! Tu as tout juste !`,
      color: 'from-cyan-400 to-blue-500',
      particleColor: 'bg-cyan-400',
      sound: 'perfect',
      duration: 3500
    },
    comeback: {
      emoji: '💪',
      title: 'Quel comeback !',
      message: `Tu ne lâches jamais, ${studentName} ! Bravo !`,
      color: 'from-indigo-400 to-purple-500',
      particleColor: 'bg-indigo-400',
      sound: 'comeback',
      duration: 2800
    },
    milestone: {
      emoji: '🏆',
      title: 'Étape importante !',
      message: `${data.milestone || `Félicitations ${studentName} !`}`,
      color: 'from-amber-400 to-yellow-500',
      particleColor: 'bg-amber-400',
      sound: 'achievement',
      duration: 3200
    },
    achievement_unlocked: {
      emoji: '🎖️',
      title: 'Succès débloqué !',
      message: `${data.achievement || `Incroyable ${studentName} !`}`,
      color: 'from-emerald-400 to-teal-500',
      particleColor: 'bg-emerald-400',
      sound: 'unlock',
      duration: 3000
    },
    daily_goal: {
      emoji: '📅',
      title: 'Objectif quotidien !',
      message: `Tu as atteint ton objectif du jour, ${studentName} ! 🎯`,
      color: 'from-blue-400 to-cyan-500',
      particleColor: 'bg-blue-400',
      sound: 'goal',
      duration: 2600
    },
    weekly_champion: {
      emoji: '👑',
      title: 'Champion de la semaine !',
      message: `Tu es le roi de cette semaine, ${studentName} ! 👑`,
      color: 'from-purple-600 to-pink-600',
      particleColor: 'bg-purple-500',
      sound: 'royal',
      duration: 4000
    }
  };

  const config = celebrations[type];

  // Adaptive confetti based on performance
  const confettiCount = getOptimalParticleCount(type === 'level_up' ? 50 : 30);

  // Play celebration sequence
  const playCelebrationSequence = useCallback(async () => {
    const baseDuration = getOptimalDuration(config.duration);
    
    // Phase 1: Dramatic entrance
    setPhase('enter');
    setShowConfetti(true);
    
    await mainControls.start({
      scale: [0, 1.2, 1],
      rotate: [0, 10, 0],
      opacity: [0, 1, 1],
      transition: {
        duration: 0.8,
        type: "spring",
        damping: 20
      }
    });

    // Phase 2: Main celebration
    setPhase('celebrate');
    
    await textControls.start({
      y: [30, 0],
      opacity: [0, 1],
      scale: [0.8, 1],
      transition: {
        duration: 0.6,
        type: "spring"
      }
    });

    // Phase 3: Show rewards if any
    if (data.xpGained || data.newLevel) {
      setTimeout(() => setPhase('reward'), baseDuration * 0.3);
      await new Promise(resolve => setTimeout(resolve, baseDuration * 0.4));
    }

    // Phase 4: Exit
    setTimeout(() => {
      setPhase('exit');
      setShowConfetti(false);
      setTimeout(onComplete, 800);
    }, baseDuration * 0.6);

  }, [config, mainControls, textControls, getOptimalDuration, data, onComplete]);

  useEffect(() => {
    playCelebrationSequence();
  }, [playCelebrationSequence]);

  // Contextual confetti system
  const ContextualConfetti = memo(() => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(confettiCount)].map((_, i) => {
        const shapes = ['circle', 'square', 'triangle'];
        const shape = shapes[i % shapes.length];
        const colors = ['bg-yellow-400', 'bg-pink-400', 'bg-blue-400', 'bg-green-400', config.particleColor];
        const color = colors[i % colors.length];
        
        return (
          <motion.div
            key={i}
            className={`absolute w-3 h-3 ${color} ${
              shape === 'circle' ? 'rounded-full' : 
              shape === 'square' ? 'rounded-sm' : 
              'transform rotate-45'
            }`}
            initial={{
              x: Math.random() * window.innerWidth,
              y: -20,
              scale: 0,
              opacity: 0,
              rotate: 0
            }}
            animate={{
              y: window.innerHeight + 20,
              x: Math.random() * window.innerWidth,
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              rotate: [0, Math.random() * 720 - 360]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              delay: Math.random() * 2,
              ease: "easeOut"
            }}
          />
        );
      })}
    </div>
  ));

  // Dynamic emoji animation based on celebration type
  const CelebrationEmoji = memo(() => (
    <motion.div
      className="text-8xl mb-6 filter drop-shadow-2xl"
      animate={{
        scale: type === 'level_up' ? [1, 1.3, 1.1, 1] : [1, 1.2, 1],
        rotate: type === 'streak' ? [0, 10, -10, 0] : [0, 5, -5, 0],
        y: type === 'perfect_score' ? [0, -10, 0] : 0
      }}
      transition={{
        duration: type === 'level_up' ? 2 : 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {config.emoji}
    </motion.div>
  ));

  // Contextual messages with dynamic content
  const getMessage = () => {
    let baseMessage = config.message;
    
    if (data.score && data.score === 100) {
      baseMessage += ' Score parfait ! 💯';
    } else if (data.timeSpent && data.timeSpent < 30) {
      baseMessage += ' Et en un temps record ! ⚡';
    }
    
    if (data.difficulty === 'Difficile') {
      baseMessage += ' Un exercice difficile en plus ! 🏆';
    }
    
    return baseMessage;
  };

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed inset-0 z-50 bg-gradient-to-br ${config.color} bg-opacity-95 backdrop-blur-sm`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Confetti */}
        <AnimatePresence>
          {showConfetti && <ContextualConfetti />}
        </AnimatePresence>

        {/* Animated background elements */}
        {shouldUseComplexAnimation() && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-24 h-24 bg-white/10 rounded-full blur-xl"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                }}
                animate={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  scale: [1, 2, 1],
                }}
                transition={{
                  duration: Math.random() * 8 + 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        )}

        {/* Main celebration content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center">
          <motion.div
            animate={mainControls}
            className="flex flex-col items-center"
          >
            <CelebrationEmoji />
            
            <motion.h1 
              className="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-lg"
              animate={textControls}
            >
              {config.title}
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl leading-relaxed"
              animate={textControls}
              transition={{ delay: 0.2 }}
            >
              {getMessage()}
            </motion.p>

            {/* Rewards display */}
            <AnimatePresence>
              {phase === 'reward' && (data.xpGained || data.newLevel) && (
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                >
                  {data.xpGained && (
                    <MicroInteraction
                      type="card"
                      intensity="high"
                      className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/30"
                    >
                      <div className="flex items-center space-x-2 text-white">
                        <span className="text-2xl">⭐</span>
                        <span className="font-bold text-lg">+{data.xpGained} XP</span>
                      </div>
                    </MicroInteraction>
                  )}
                  
                  {data.newLevel && (
                    <MicroInteraction
                      type="card"
                      intensity="epic"
                      className="bg-white/25 backdrop-blur-sm rounded-2xl px-8 py-4 border-2 border-white/40"
                    >
                      <div className="flex items-center space-x-3 text-white">
                        <span className="text-3xl">🏆</span>
                        <div>
                          <div className="font-black text-xl">Niveau {data.newLevel}</div>
                          <div className="text-white/80">Débloqué !</div>
                        </div>
                      </div>
                    </MicroInteraction>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Continue button */}
            {phase === 'reward' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
              >
                <MicroInteraction
                  type="button"
                  intensity="epic"
                  onClick={onComplete}
                  className="mt-8 bg-white/20 backdrop-blur-sm text-white font-bold px-8 py-4 rounded-2xl border border-white/30"
                >
                  <div className="flex items-center space-x-2">
                    <span>Continuer l'aventure</span>
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </div>
                </MicroInteraction>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Performance debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
            {type} | {performanceTier} | {phase} | particles: {confettiCount}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
});

CelebrationSystem.displayName = 'CelebrationSystem';

export default CelebrationSystem;