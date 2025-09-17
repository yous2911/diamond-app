import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  striped?: boolean;
  glow?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = React.memo(({
  progress,
  className = '',
  showPercentage = true,
  color = 'blue',
  size = 'md',
  animated = true,
  striped = false,
  glow = false
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6'
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500'
  };

  const glowClasses = {
    blue: 'shadow-lg shadow-blue-500/50',
    green: 'shadow-lg shadow-green-500/50',
    yellow: 'shadow-lg shadow-yellow-500/50',
    purple: 'shadow-lg shadow-purple-500/50',
    red: 'shadow-lg shadow-red-500/50'
  };

  const baseClasses = `
    relative w-full ${sizeClasses[size]} bg-gray-200 rounded-full overflow-hidden
    ${className}
  `.trim();

  const fillClasses = `
    h-full ${colorClasses[color]} transition-all duration-500 ease-out
    ${striped ? 'bg-striped' : ''}
    ${glow ? glowClasses[color] : ''}
  `.trim();

  return (
    <div className="relative">
      <div className={baseClasses}>
        <motion.div
          className={fillClasses}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{
            duration: animated ? 0.8 : 0,
            ease: 'easeOut'
          }}
        >
          {/* Shimmer effect */}
          {animated && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          )}
          
          {/* Striped pattern */}
          {striped && (
            <div className="absolute inset-0 bg-striped-pattern opacity-20" />
          )}
        </motion.div>

        {/* Glow effect */}
        {glow && (
          <motion.div
            className={`absolute inset-0 rounded-full ${colorClasses[color]} opacity-20 blur-sm`}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}
      </div>

      {/* Percentage display */}
      {showPercentage && size !== 'sm' && (
        <AnimatePresence>
          <motion.div
            className="absolute right-0 top-0 transform -translate-y-8 text-sm font-medium text-gray-700"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {Math.round(clampedProgress)}%
          </motion.div>
        </AnimatePresence>
      )}

      {/* Success celebration */}
      {clampedProgress >= 100 && animated && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <motion.div
            className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 1,
              ease: 'easeInOut'
            }}
          >
            ✓
          </motion.div>
        </motion.div>
      )}
    </div>
  );
});

// Preset variants for educational contexts
export const LevelProgressBar: React.FC<Omit<ProgressBarProps, 'color' | 'glow'>> = (props) => (
  <ProgressBar
    {...props}
    color="blue"
    glow={true}
    animated={true}
  />
);

export const SkillProgressBar: React.FC<Omit<ProgressBarProps, 'color' | 'striped'>> = (props) => (
  <ProgressBar
    {...props}
    color="green"
    striped={true}
    animated={true}
  />
);

export const GameProgressBar: React.FC<Omit<ProgressBarProps, 'color' | 'size'>> = (props) => (
  <ProgressBar
    {...props}
    color="yellow"
    size="lg"
    glow={true}
    animated={true}
  />
);

export const AchievementProgressBar: React.FC<Omit<ProgressBarProps, 'color'>> = (props) => (
  <ProgressBar
    {...props}
    color="purple"
    glow={true}
    striped={true}
    animated={true}
  />
);