import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types pour les cristaux XP
export type CrystalType = 'basic' | 'blue' | 'green' | 'purple' | 'rainbow' | 'legendary';
export type CrystalSize = 'small' | 'medium' | 'large';
export type CrystalAnimationState = 'idle' | 'gaining' | 'losing' | 'levelUp' | 'maxed';

interface XPCrystalProps {
  xp: number;
  maxXp: number;
  level: number;
  crystalType?: CrystalType;
  size?: CrystalSize;
  animationState?: CrystalAnimationState;
  onLevelUp?: () => void;
  className?: string;
  enableSounds?: boolean;
  enableHaptics?: boolean;
}

// Configuration des types de cristaux
const getCrystalConfig = (type: CrystalType): { colors: string; glow: string; emoji: string } => {
  switch (type) {
    case 'basic':
      return {
        colors: 'from-neutral-300 to-neutral-400',
        glow: 'shadow-neutral-400',
        emoji: '💎',
      };
    case 'blue':
      return {
        colors: 'from-blue-400 to-cyan-400',
        glow: 'shadow-blue-400',
        emoji: '💧',
      };
    case 'green':
      return {
        colors: 'from-green-400 to-emerald-500',
        glow: 'shadow-green-400',
        emoji: '🌿',
      };
    case 'purple':
      return {
        colors: 'from-purple-400 to-violet-500',
        glow: 'shadow-purple-400',
        emoji: '🔮',
      };
    case 'rainbow':
      return {
        colors: 'from-purple-400 via-blue-400 via-green-400 via-yellow-400 to-pink-400',
        glow: 'shadow-purple-400',
        emoji: '🌈',
      };
    case 'legendary':
      return {
        colors: 'from-yellow-400 to-orange-500',
        glow: 'shadow-yellow-400',
        emoji: '👑',
      };
    default:
      return getCrystalConfig('basic');
  }
};

// Configuration des tailles de cristal
const getSizeConfig = (size: CrystalSize): { container: string; text: string } => {
  switch (size) {
    case 'small':
      return {
        container: 'w-16 h-16',
        text: 'text-3xl'
      };
    case 'medium':
      return {
        container: 'w-24 h-24',
        text: 'text-4xl'
      };
    case 'large':
      return {
        container: 'w-32 h-32',
        text: 'text-5xl'
      };
    default:
      return getSizeConfig('medium');
  }
};

const XPCrystal: React.FC<XPCrystalProps> = ({
  xp,
  maxXp,
  level,
  crystalType = 'basic',
  size = 'medium',
  animationState = 'idle',
  onLevelUp,
  className = '',
  enableSounds = true,
  enableHaptics = true
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [previousXP, setPreviousXP] = useState(xp);
  const [previousLevel, setPreviousLevel] = useState(level);
  const crystalRef = useRef<HTMLDivElement>(null);

  const crystalConfig = getCrystalConfig(crystalType);
  const sizeConfig = getSizeConfig(size);
  const progressPercentage = Math.min((xp / maxXp) * 100, 100);

  // Check for level up
  useEffect(() => {
    if (level > previousLevel) {
      setIsAnimating(true);
      setShowParticles(true);
      
      // Trigger level up animation
      setTimeout(() => {
        onLevelUp?.();
        setIsAnimating(false);
      }, 2000);
      
      // Hide particles after animation
      setTimeout(() => {
        setShowParticles(false);
      }, 3000);
    }
    
    setPreviousLevel(level);
  }, [level, previousLevel, onLevelUp]);

  // Check for XP gain/loss
  useEffect(() => {
    if (xp !== previousXP) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
      setPreviousXP(xp);
    }
  }, [xp, previousXP]);

  // Particle effect for level up
  const Particle: React.FC<{ delay: number; direction: 'up' | 'down' | 'left' | 'right' }> = ({ delay, direction }) => {
    const getDirectionStyles = () => {
      switch (direction) {
        case 'up': return { y: [0, -50], x: [0, Math.random() * 20 - 10] };
        case 'down': return { y: [0, 50], x: [0, Math.random() * 20 - 10] };
        case 'left': return { x: [0, -50], y: [0, Math.random() * 20 - 10] };
        case 'right': return { x: [0, 50], y: [0, Math.random() * 20 - 10] };
      }
    };

    return (
      <motion.div
        className="absolute w-2 h-2 bg-yellow-300 rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 1, 0],
          opacity: [0, 1, 0],
          ...getDirectionStyles()
        }}
        transition={{
          duration: 2,
          delay,
          ease: "easeOut"
        }}
      />
    );
  };

  // Get animation variants based on state
  const getAnimationVariants = () => {
    switch (animationState) {
      case 'gaining':
        return {
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
          transition: { duration: 0.5 }
        };
      case 'losing':
        return {
          scale: [1, 0.9, 1],
          rotate: [0, -5, 5, 0],
          transition: { duration: 0.5 }
        };
      case 'levelUp':
        return {
          scale: [1, 1.3, 1],
          rotate: [0, 360],
          transition: { duration: 1, ease: "easeInOut" as const }
        };
      case 'maxed':
        return {
          scale: [1, 1.05, 1],
          transition: { duration: 2, repeat: Infinity }
        };
      default:
        return {
          scale: 1,
          rotate: 0
        };
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Crystal */}
      <motion.div
        ref={crystalRef}
        className={`
          ${sizeConfig.container} 
          bg-gradient-to-br ${crystalConfig.colors}
          rounded-full flex items-center justify-center
          shadow-lg ${crystalConfig.glow}
          border-2 border-white/30
          relative overflow-hidden
        `}
        animate={getAnimationVariants()}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Crystal emoji */}
        <motion.span
          className={`${sizeConfig.text} select-none`}
          animate={isAnimating ? { 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          } : {}}
          transition={{ duration: 0.5 }}
        >
          {crystalConfig.emoji}
        </motion.span>

        {/* Progress ring */}
        <svg
          className="absolute inset-0 w-full h-full transform -rotate-90"
          viewBox="0 0 100 100"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="3"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255, 255, 255, 0.8)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ strokeDasharray: 0, strokeDashoffset: 0 }}
            animate={{
              strokeDasharray: `${2 * Math.PI * 45}`,
              strokeDashoffset: `${2 * Math.PI * 45 * (1 - progressPercentage / 100)}`
            }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        </svg>

                 {/* XP text overlay */}
         <div className="absolute bottom-0 left-0 right-0 text-center text-xs font-bold text-white bg-black/20 rounded-b-full py-1">
           {xp}/{maxXp}
         </div>
      </motion.div>

      {/* Level indicator */}
      <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
        {level}
      </div>

      {/* Particles for level up */}
      <AnimatePresence>
        {showParticles && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 12 }, (_, i) => (
              <Particle
                key={i}
                delay={i * 0.1}
                direction={['up', 'down', 'left', 'right'][i % 4] as 'up' | 'down' | 'left' | 'right'}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Glow effect */}
      <motion.div
        className={`absolute inset-0 rounded-full ${crystalConfig.glow} blur-xl opacity-50`}
        animate={{
          scale: isAnimating ? [1, 1.2, 1] : 1,
          opacity: isAnimating ? [0.5, 0.8, 0.5] : 0.5
        }}
        transition={{ duration: 2, repeat: isAnimating ? Infinity : 0 }}
      />
    </div>
  );
};

export default XPCrystal;
