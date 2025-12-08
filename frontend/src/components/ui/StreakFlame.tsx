import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMagicalSounds } from '../../hooks/useMagicalSounds';

interface StreakProps {
  days: number;
  isActive: boolean; // Did they complete exercises today?
  isFrozen?: boolean; // Is streak protected by freeze?
  streakFreezes?: number; // Available freeze count
  onUseFreeze?: () => void; // Callback to use a freeze
}

export const StreakFlame: React.FC<StreakProps> = ({ 
  days, 
  isActive, 
  isFrozen = false,
  streakFreezes = 0,
  onUseFreeze 
}) => {
  const [showIgnition, setShowIgnition] = useState(false);
  const [showFreezePrompt, setShowFreezePrompt] = useState(false);
  const { playSparkleSound } = useMagicalSounds();

  useEffect(() => {
    if (isActive) {
      setShowIgnition(true);
      playSparkleSound();
    }
  }, [isActive, playSparkleSound]);

  return (
    <motion.div 
      layout
      className="relative flex flex-col items-center justify-center p-2 sm:p-4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Flame Container */}
      <div className="relative w-32 h-40">
        
        <AnimatePresence>
          {isFrozen ? (
            /* ❄️ FROZEN STATE - Streak is protected */
            <>
              <motion.div
                className="absolute inset-0 bg-blue-400/30 rounded-full blur-xl opacity-60"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.6, 0.8, 0.6],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="absolute bottom-0 left-1/2 w-24 h-32 bg-gradient-to-t from-blue-400 via-cyan-300 to-white rounded-t-full rounded-b-3xl transform -translate-x-1/2 flex items-center justify-center border-4 border-blue-300">
                <span className="text-4xl">❄️</span>
              </div>
            </>
          ) : isActive ? (
            <>
              {/* Outer Glow */}
              <motion.div
                className="absolute inset-0 bg-orange-500 rounded-full blur-xl opacity-50"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* Core Flame (Orange) */}
              <motion.div
                className="absolute bottom-0 left-1/2 w-24 h-32 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 rounded-t-full rounded-b-3xl"
                style={{ x: '-50%' }}
                animate={{
                  height: ['80%', '100%', '85%'],
                  borderTopLeftRadius: ['50% 40%', '60% 30%', '50% 40%'],
                  borderTopRightRadius: ['50% 40%', '30% 60%', '50% 40%'],
                }}
                transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
              />

              {/* Inner Flame (Yellow/White) */}
              <motion.div
                className="absolute bottom-2 left-1/2 w-16 h-24 bg-gradient-to-t from-yellow-300 via-yellow-100 to-white rounded-t-full rounded-b-2xl blur-sm"
                style={{ x: '-50%' }}
                animate={{
                  height: ['70%', '90%', '75%'],
                  y: [0, -5, 0],
                }}
                transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse" }}
              />

              {/* Sparks */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute bottom-10 left-1/2 w-2 h-2 bg-yellow-200 rounded-full"
                  initial={{ opacity: 0, y: 0, x: 0 }}
                  animate={{
                    opacity: [1, 0],
                    y: -100 - Math.random() * 50,
                    x: (Math.random() - 0.5) * 60,
                    scale: [1, 0]
                  }}
                  transition={{
                    duration: 1 + Math.random(),
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: "easeOut"
                  }}
                />
              ))}
            </>
          ) : (
            /* Frozen State (Inactive) */
            <div className="absolute bottom-0 left-1/2 w-24 h-32 bg-slate-300 rounded-t-full rounded-b-3xl transform -translate-x-1/2 flex items-center justify-center border-4 border-slate-400">
              <span className="text-4xl grayscale opacity-50">🔥</span>
            </div>
          )}
        </AnimatePresence>

        {/* The Streak Number */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pt-8">
          {days === 0 ? (
            /* Empty State - Encourage first streak */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <motion.span 
                className="text-3xl sm:text-4xl font-black text-orange-400"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🔥
              </motion.span>
              <p className="text-xs sm:text-sm text-orange-600 font-bold mt-1">
                Allume ta flamme !
              </p>
            </motion.div>
          ) : (
            <motion.span 
              className={`text-4xl sm:text-5xl font-black ${isActive ? 'text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]' : 'text-slate-500'}`}
              animate={isActive ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {days}
            </motion.span>
          )}
        </div>
      </div>

      {/* Label */}
      <motion.div 
        className={`mt-4 px-4 py-1 rounded-full shadow-lg border ${
          isFrozen ? 'bg-blue-100 border-blue-200' :
          isActive ? 'bg-white/90 border-orange-100' : 'bg-slate-100 border-slate-200'
        }`}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <span className={`font-bold uppercase tracking-wider text-sm ${
          isFrozen ? 'text-blue-600' :
          isActive ? 'text-orange-600' : 'text-slate-500'
        }`}>
          {isFrozen ? '❄️ Protégé' : 'Série de Jours'}
        </span>
      </motion.div>

      {/* Freeze Button (if not active and has freezes) */}
      {!isActive && !isFrozen && streakFreezes > 0 && days > 0 && (
        <motion.button
          onClick={() => {
            if (onUseFreeze) {
              onUseFreeze();
            }
          }}
          className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          layout
        >
          ❄️ Utiliser un Joker ({streakFreezes})
        </motion.button>
      )}
      
      {/* Empty State CTA - Encourage first exercise */}
      {days === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-center"
        >
          <p className="text-xs text-gray-600">
            Fais ton premier exercice pour allumer ta flamme ! 🔥
          </p>
        </motion.div>
      )}

      {/* Ignition Flash */}
      <AnimatePresence>
        {showIgnition && (
          <motion.div
            className="absolute inset-0 bg-orange-400 rounded-full z-20 pointer-events-none"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2, opacity: [0, 0.8, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

