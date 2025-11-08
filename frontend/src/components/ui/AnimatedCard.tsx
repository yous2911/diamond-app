import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  delay?: number;
  duration?: number;
  scale?: boolean;
  rotate?: boolean;
  bounce?: boolean;
  glow?: boolean;
  shadow?: boolean;
  border?: boolean;
  gradient?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'sparkle' | 'reward' | 'progress' | 'exercise';
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = '',
  onClick,
  hover = true,
  delay = 0,
  duration = 0.3,
  scale = true,
  rotate = false,
  bounce = false,
  glow = false,
  shadow = true,
  border = false,
  gradient = false,
  disabled = false,
  variant = 'default'
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  // Apply variant-specific styling
  const getVariantClasses = () => {
    switch (variant) {
      case 'sparkle':
        return 'bg-gradient-to-br from-yellow-50 to-orange-100 border-yellow-300';
      case 'reward':
        return 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-300';
      case 'progress':
        return 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-300';
      case 'exercise':
        return 'bg-gradient-to-br from-purple-50 to-violet-100 border-purple-300';
      default:
        return gradient ? 'bg-gradient-to-br from-blue-50 to-indigo-100' : 'bg-white';
    }
  };

  const baseClasses = `
    relative overflow-hidden rounded-xl p-4 transition-all duration-300
    ${shadow ? 'shadow-lg hover:shadow-xl' : ''}
    ${border || variant !== 'default' ? 'border-2' : ''}
    ${variant !== 'default' ? getVariantClasses() : (gradient ? 'bg-gradient-to-br from-blue-50 to-indigo-100' : 'bg-white')}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `.trim();

  const hoverVariants = {
    hover: prefersReducedMotion ? {} : {
      scale: scale ? 1.05 : 1,
      rotate: rotate ? 5 : 0,
      y: bounce ? -5 : 0,
      boxShadow: glow ? '0 0 20px rgba(59, 130, 246, 0.5)' : undefined,
      transition: {
        duration: duration,
        ease: 'easeInOut' as const
      }
    },
    tap: prefersReducedMotion ? {} : {
      scale: 0.95,
      transition: {
        duration: 0.1
      }
    }
  };

  const animationVariants = {
    initial: prefersReducedMotion ? {
      opacity: 1,
      y: 0,
      scale: 1,
      rotate: 0
    } : {
      opacity: 0,
      y: 20,
      scale: 0.9,
      rotate: rotate ? -5 : 0
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotate: 0,
      transition: prefersReducedMotion ? {
        duration: 0.01
      } : {
        duration: duration,
        delay: delay,
        ease: 'easeOut' as const
      }
    },
    exit: prefersReducedMotion ? {
      opacity: 1,
      y: 0,
      scale: 1
    } : {
      opacity: 0,
      y: -20,
      scale: 0.9,
      transition: {
        duration: duration * 0.5
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className={baseClasses}
        variants={hover ? hoverVariants : animationVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        whileHover={!prefersReducedMotion && hover && !disabled ? "hover" : undefined}
        whileTap={!prefersReducedMotion && !disabled ? "tap" : undefined}
        onClick={!disabled ? onClick : undefined}
        layout
      >
        {/* Glow effect */}
        {glow && !prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0"
            animate={{
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Shimmer effect on hover */}
        {!prefersReducedMotion && hover && !disabled && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{
              duration: 0.8,
              ease: 'easeInOut'
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Variant components for different use cases
export const InteractiveCard: React.FC<AnimatedCardProps> = (props) => (
  <AnimatedCard
    {...props}
    hover={true}
    scale={true}
    shadow={true}
    glow={true}
  />
);

export const StaticCard: React.FC<AnimatedCardProps> = (props) => (
  <AnimatedCard
    {...props}
    hover={false}
    scale={false}
    shadow={true}
    glow={false}
  />
);

export const FloatingCard: React.FC<AnimatedCardProps> = (props) => (
  <AnimatedCard
    {...props}
    hover={true}
    scale={true}
    bounce={true}
    shadow={true}
    glow={true}
    className={`${props.className} hover:shadow-2xl`}
  />
);

export const GameCard: React.FC<AnimatedCardProps> = (props) => (
  <AnimatedCard
    {...props}
    hover={true}
    scale={true}
    bounce={true}
    glow={true}
    shadow={true}
    border={true}
    className={`${props.className} bg-gradient-to-br from-yellow-50 to-orange-100 border-orange-300`}
  />
);

export const SuccessCard: React.FC<AnimatedCardProps> = (props) => (
  <AnimatedCard
    {...props}
    hover={true}
    scale={true}
    glow={true}
    className={`${props.className} bg-gradient-to-br from-green-50 to-emerald-100 border-green-300`}
  />
);

export const ErrorCard: React.FC<AnimatedCardProps> = (props) => (
  <AnimatedCard
    {...props}
    hover={true}
    scale={true}
    className={`${props.className} bg-gradient-to-br from-red-50 to-pink-100 border-red-300`}
  />
);