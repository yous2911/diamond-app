import React, { useEffect, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useGPUPerformance } from '../hooks/useGPUPerformance';
import { useReducedMotion } from '../hooks/useReducedMotion';
import MicroInteraction from './MicroInteractions';

// =============================================================================
// 🎬 MEMORABLE ENTRANCE SYSTEM - WORLD CLASS FIRST IMPRESSIONS
// =============================================================================

interface MemorableEntranceProps {
  studentName: string;
  level: string;
  onComplete: () => void;
  achievements?: string[];
}

const MemorableEntrance = memo<MemorableEntranceProps>(({ 
  studentName, 
  level, 
  onComplete,
  achievements = []
}) => {
  const [phase, setPhase] = useState<'logo' | 'greeting' | 'achievements' | 'ready' | 'complete'>('logo');
  const [showParticles, setShowParticles] = useState(false);
  const { 
    getOptimalDuration, 
    shouldUseComplexAnimation, 
    performanceTier,
    getOptimalParticleCount 
  } = useGPUPerformance();
  
  const prefersReducedMotion = useReducedMotion();
  
  const logoControls = useAnimation();
  const textControls = useAnimation();
  const containerControls = useAnimation();

  // Memorable entrance sequence
  const playEntranceSequence = useCallback(async () => {
    const baseDuration = getOptimalDuration(1000);
    const animationDuration = prefersReducedMotion ? 0.1 : baseDuration / 1000;
    
    // Phase 1: Logo reveal with magical entrance
    setPhase('logo');
    setShowParticles(!prefersReducedMotion);
    
    await logoControls.start({
      scale: prefersReducedMotion ? [1, 1] : [0, 1.2, 1],
      rotate: prefersReducedMotion ? 0 : [0, 360, 0],
      opacity: [0, 1, 1],
      transition: { 
        duration: animationDuration,
        type: prefersReducedMotion ? "tween" : "spring", 
        damping: 20 
      }
    });

    // Phase 2: Personalized greeting
    setTimeout(() => setPhase('greeting'), baseDuration * 0.3);
    
    await textControls.start({
      y: prefersReducedMotion ? 0 : [50, 0],
      opacity: [0, 1],
      scale: prefersReducedMotion ? 1 : [0.8, 1],
      transition: { 
        duration: prefersReducedMotion ? 0.1 : baseDuration / 1000 * 0.8,
        type: prefersReducedMotion ? "tween" : "spring"
      }
    });

    // Phase 3: Show achievements if any
    if (achievements.length > 0) {
      setTimeout(() => setPhase('achievements'), baseDuration * 0.5);
      
      await new Promise(resolve => setTimeout(resolve, baseDuration * 0.7));
    }

    // Phase 4: Ready state with call-to-action
    setTimeout(() => setPhase('ready'), baseDuration * 0.2);
    
    // Phase 5: Complete entrance
    setTimeout(() => {
      setPhase('complete');
      setTimeout(onComplete, baseDuration * 0.3);
    }, baseDuration * 1.2);

  }, [
    logoControls, 
    textControls, 
    getOptimalDuration, 
    achievements.length, 
    onComplete,
    prefersReducedMotion
  ]);

  useEffect(() => {
    playEntranceSequence();
  }, [playEntranceSequence]);

  // Dynamic particles based on performance and accessibility
  const particleCount = prefersReducedMotion ? 0 : getOptimalParticleCount(25);
  
  const MagicalParticles = memo(() => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(particleCount)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 20,
            scale: 0,
            opacity: 0
          }}
          animate={{
            y: -20,
            x: Math.random() * window.innerWidth,
            scale: [0, 1, 0],
            opacity: [0, 0.8, 0],
            rotate: [0, 360]
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            delay: i * 0.1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  ));

  const LogoPhase = memo(() => (
    <motion.div
      className="flex flex-col items-center justify-center h-full"
      animate={logoControls}
    >
      <motion.div
        className="text-8xl mb-4 filter drop-shadow-2xl"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        💎
      </motion.div>
      
      <motion.h1 
        className="text-4xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        DIAMOND APP
      </motion.h1>
      
      <motion.div
        className="mt-4 text-lg text-slate-600 font-semibold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        Interface Premium
      </motion.div>
    </motion.div>
  ));

  const GreetingPhase = memo(() => (
    <motion.div
      className="flex flex-col items-center justify-center h-full text-center"
      animate={textControls}
    >
      <motion.div
        className="text-6xl mb-6"
        animate={{
          rotate: [0, 10, -10, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        👋
      </motion.div>
      
      <motion.h2 
        className="text-3xl font-bold text-slate-700 mb-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        Salut {studentName} !
      </motion.h2>
      
      <motion.p 
        className="text-xl text-slate-600 mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        Tu es en <span data-testid="entrance-level" className="font-bold text-blue-600">{level}</span>
      </motion.p>
      
      <motion.div
        className="text-lg text-slate-500"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        Prêt pour une nouvelle aventure ? ✨
      </motion.div>
    </motion.div>
  ));

  const AchievementsPhase = memo(() => (
    <motion.div
      className="flex flex-col items-center justify-center h-full"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2 }}
    >
      <motion.div
        className="text-5xl mb-6"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.3, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity
        }}
      >
        🏆
      </motion.div>
      
      <h3 className="text-2xl font-bold text-slate-700 mb-6">
        Tes derniers succès !
      </h3>
      
      <div className="space-y-3 max-w-md">
        {achievements.slice(0, 3).map((achievement, index) => (
          <motion.div
            key={achievement}
            className="bg-gradient-to-r from-yellow-100 to-orange-100 p-3 rounded-lg border-l-4 border-yellow-500"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <div className="flex items-center space-x-2">
              <span className="text-xl">⭐</span>
              <span className="text-slate-700 font-medium">{achievement}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  ));

  const ReadyPhase = memo(() => (
    <motion.div
      className="flex flex-col items-center justify-center h-full"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, type: "spring" }}
    >
      <motion.div
        className="text-6xl mb-8"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity
        }}
      >
        🚀
      </motion.div>
      
      <motion.h2 
        className="text-3xl font-bold text-slate-700 mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        C'est parti !
      </motion.h2>
      
      <MicroInteraction
        type="button"
        intensity="epic"
        className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl"
      >
        <motion.div
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>Commencer l'aventure</span>
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            →
          </motion.span>
        </motion.div>
      </MicroInteraction>
    </motion.div>
  ));

  if (phase === 'complete') {
    return null;
  }

  return (
    <motion.div
      data-testid="memorable-entrance"
      className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
      animate={containerControls}
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        scale: 1.1,
        transition: { duration: 0.8 }
      }}
    >
      {/* Magical background particles */}
      <AnimatePresence>
        {showParticles && <MagicalParticles />}
      </AnimatePresence>

      {/* Animated background shapes */}
      {shouldUseComplexAnimation() && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-32 h-32 bg-gradient-to-r from-cyan-200/20 to-blue-300/20 rounded-full blur-xl"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 h-full flex items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {phase === 'logo' && <LogoPhase />}
          {phase === 'greeting' && <GreetingPhase />}
          {phase === 'achievements' && <AchievementsPhase />}
          {phase === 'ready' && <ReadyPhase />}
        </AnimatePresence>
      </div>

      {/* Performance indicator (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          Performance: {performanceTier} | Phase: {phase}
        </div>
      )}
    </motion.div>
  );
});

MemorableEntrance.displayName = 'MemorableEntrance';

export default MemorableEntrance;