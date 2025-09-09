import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useMagicalSounds } from '../hooks/useMagicalSounds';
import EnhancedLevelUpSystem from './EnhancedLevelUpSystem';

// =============================================================================
// 💎 CRISTAUX XP PREMIUM AVEC PHYSIQUE 3D
// =============================================================================
interface XPCrystalsPremiumProps {
  currentXP: number;
  maxXP: number;
  level: number;
  onLevelUp: (newLevel: number) => void;
  studentName?: string;
  achievements?: string[];
}

const XPCrystalsPremium = memo<XPCrystalsPremiumProps>(({ 
  currentXP, 
  maxXP, 
  level, 
  onLevelUp,
  studentName = 'Élève',
  achievements = []
}) => {
  const [displayXP, setDisplayXP] = useState(currentXP);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [showXPGain, setShowXPGain] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const crystalRef = useRef<HTMLDivElement>(null);
  const mainControls = useAnimation();
  const { playLevelUpFanfare, playSparkleSound } = useMagicalSounds();

  const progress = Math.min((displayXP / maxXP) * 100, 100);

  // Level up detection
  useEffect(() => {
    const expectedLevel = Math.floor(displayXP / 100) + 1;
    if (expectedLevel > level && !isLevelingUp) {
      setIsLevelingUp(true);
      playLevelUpFanfare();
      onLevelUp(expectedLevel);
      
      setTimeout(() => setIsLevelingUp(false), 3000);
    }
  }, [displayXP, level, onLevelUp, isLevelingUp, playLevelUpFanfare]);

  // XP animation
  useEffect(() => {
    if (currentXP > displayXP) {
      const difference = currentXP - displayXP;
      setShowXPGain(difference);
      playSparkleSound();
      
      const duration = 1000;
      const steps = 30;
      const increment = difference / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        setDisplayXP(prev => Math.min(prev + increment, currentXP));
        
        if (currentStep >= steps) {
          clearInterval(timer);
          setDisplayXP(currentXP);
          setTimeout(() => setShowXPGain(null), 1000);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [currentXP, displayXP, playSparkleSound]);

  // Breathing animation
  useEffect(() => {
    mainControls.start({
      scale: [1, 1.05, 1],
      rotate: [0, 2, 0],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    });
  }, [mainControls]);

  return (
    <div className="relative">
      {/* Enhanced Level Up System */}
      {isLevelingUp && (
        <EnhancedLevelUpSystem
          isLevelingUp={true}
          newLevel={level}
          studentName={studentName}
          achievements={achievements}
          onLevelUpComplete={() => setIsLevelingUp(false)}
        />
      )}

      {/* Main Crystal Container */}
      <motion.div
        ref={crystalRef}
        className="relative w-32 h-32 cursor-pointer"
        animate={mainControls}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Multi-layered Aura */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => {
            const sizes = ['w-full h-full', 'w-5/6 h-5/6', 'w-4/6 h-4/6'];
            const colors = [
              level > 10 ? 'bg-purple-500' : level > 5 ? 'bg-blue-500' : 'bg-green-500',
              level > 10 ? 'bg-pink-400' : level > 5 ? 'bg-cyan-400' : 'bg-emerald-400',
              level > 10 ? 'bg-purple-300' : level > 5 ? 'bg-blue-300' : 'bg-green-300'
            ];
            const blurs = [40, 25, 15];
            
            return (
              <motion.div
                key={i}
                className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${sizes[i]} ${colors[i]} rounded-full opacity-30`}
                style={{ filter: `blur(${blurs[i]}px)` }}
                animate={{
                  scale: isHovered ? [1, 1.3, 1] : [1, 1.1, 1],
                  opacity: isHovered ? [0.3, 0.6, 0.3] : [0.2, 0.4, 0.2]
                }}
                transition={{
                  duration: 2 + i,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            );
          })}
        </div>

        {/* Energy Core */}
        <div className="absolute inset-4 rounded-full overflow-hidden bg-gradient-to-br from-white/20 to-transparent backdrop-blur-sm border border-white/30">
          <motion.div 
            className="w-full h-full rounded-full"
            style={{
              background: `conic-gradient(from 0deg, 
                ${level > 10 ? '#8b5cf6' : level > 5 ? '#3b82f6' : '#10b981'} 0deg,
                ${level > 10 ? '#d946ef' : level > 5 ? '#06b6d4' : '#34d399'} ${progress * 3.6}deg,
                rgba(255,255,255,0.1) ${progress * 3.6}deg,
                rgba(255,255,255,0.1) 360deg
              )`
            }}
            animate={{
              rotate: [0, 360]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          
          {/* Inner Glow */}
          <motion.div 
            className="absolute inset-2 rounded-full"
            style={{
              background: `radial-gradient(circle, 
                ${level > 10 ? 'rgba(139, 92, 246, 0.6)' : level > 5 ? 'rgba(59, 130, 246, 0.6)' : 'rgba(16, 185, 129, 0.6)'} 0%,
                transparent 70%
              )`
            }}
            animate={{
              opacity: [0.4, 0.8, 0.4],
              scale: [0.9, 1, 0.9]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        {/* Orbiting Crystals */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(Math.min(level, 6))].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-br from-white to-blue-200 rounded-full shadow-lg"
              style={{
                left: '50%',
                top: '50%',
                marginLeft: '-4px',
                marginTop: '-4px'
              }}
              animate={{
                rotate: [0, 360],
                x: [0, Math.cos((i / Math.min(level, 6)) * Math.PI * 2) * 50],
                y: [0, Math.sin((i / Math.min(level, 6)) * Math.PI * 2) * 50]
              }}
              transition={{
                rotate: { duration: 10 + (i * 2), repeat: Infinity, ease: "linear" },
                x: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }}
            />
          ))}
        </div>

        {/* Level Badge */}
        <motion.div
          className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white"
          animate={{
            scale: isLevelingUp ? [1, 1.3, 1] : 1,
            rotate: isLevelingUp ? [0, 360] : 0
          }}
          transition={{
            scale: { duration: 0.5, repeat: isLevelingUp ? 3 : 0 },
            rotate: { duration: 1, repeat: isLevelingUp ? 3 : 0 }
          }}
        >
          {level}
        </motion.div>

        {/* XP Gain Indicator */}
        <AnimatePresence>
          {showXPGain && (
            <motion.div
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg"
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              +{showXPGain} XP
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Progress Bar */}
      <div className="mt-4 relative">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full relative overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Shimmer Effect */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </div>
        
        {/* XP Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-700 drop-shadow-sm">
            {Math.round(displayXP)} / {maxXP} XP
          </span>
        </div>
      </div>

      {/* Student Name */}
      <div className="mt-2 text-center">
        <motion.span 
          className="text-sm font-medium text-gray-600"
          animate={{
            scale: isLevelingUp ? [1, 1.1, 1] : 1
          }}
          transition={{ duration: 0.5 }}
        >
          {studentName}
        </motion.span>
      </div>
    </div>
  );
});

XPCrystalsPremium.displayName = 'XPCrystalsPremium';

export default XPCrystalsPremium;