import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// Types for magical button variants
export type MagicalButtonVariant = 
  | 'primary'      // Main button (magical violet)
  | 'success'      // Success button (lime green)
  | 'fun'          // Fun button (candy pink)
  | 'energy'       // Energetic button (orange)
  | 'crystal'      // Crystal button (transparent iridescent)
  | 'rainbow'      // Rainbow button
  | 'ghost';       // Ghost button (transparent)

export type MagicalButtonSize = 'small' | 'medium' | 'large' | 'magical';

interface MagicalButtonProps {
  children: React.ReactNode;
  variant?: MagicalButtonVariant;
  size?: MagicalButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  sparkleOnHover?: boolean;
  soundEffect?: boolean;
  pulseOnClick?: boolean;
  showRipple?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  tooltip?: string;
  'data-testid'?: string;
}

// Configuration of variant classes
const getVariantClasses = (variant: MagicalButtonVariant, isHovered: boolean, isPressed: boolean): any => {
  const baseClasses = "relative overflow-hidden font-bold transition-all duration-300";
  
  switch (variant) {
    case 'primary':
      return `${baseClasses} 
        bg-gradient-to-r from-purple-600 to-blue-600 
        text-white border-2 border-purple-600
        shadow-lg hover:shadow-xl
        ${isHovered ? 'bg-gradient-to-r from-blue-600 to-cyan-600 transform scale-105' : ''}
        ${isPressed ? 'scale-95' : ''}
      `;
    
    case 'success':
      return `${baseClasses}
        bg-gradient-to-r from-green-500 to-emerald-500
        text-white border-2 border-green-500
        shadow-lg hover:shadow-xl
        ${isHovered ? 'bg-gradient-to-r from-emerald-500 to-green-400 transform scale-105' : ''}
        ${isPressed ? 'scale-95' : ''}
      `;
    
    case 'fun':
      return `${baseClasses}
        bg-gradient-to-r from-pink-500 to-rose-500
        text-white border-2 border-pink-500
        shadow-lg hover:shadow-xl
        ${isHovered ? 'bg-gradient-to-r from-rose-500 to-pink-400 transform scale-105' : ''}
        ${isPressed ? 'scale-95' : ''}
      `;
    
    case 'energy':
      return `${baseClasses}
        bg-gradient-to-r from-orange-500 to-red-500
        text-white border-2 border-orange-500
        shadow-lg hover:shadow-xl
        ${isHovered ? 'bg-gradient-to-r from-red-500 to-orange-400 transform scale-105' : ''}
        ${isPressed ? 'scale-95' : ''}
      `;
    
    case 'crystal':
      return `${baseClasses}
        bg-gradient-to-r from-cyan-200 to-blue-200
        text-blue-800 border-2 border-blue-300
        shadow-lg backdrop-blur-sm
        ${isHovered ? 'bg-gradient-to-r from-blue-300 to-cyan-300 transform scale-105' : ''}
        ${isPressed ? 'scale-95' : ''}
      `;
    
    case 'rainbow':
      return `${baseClasses}
        bg-gradient-to-r from-purple-500 via-blue-500 via-green-500 via-yellow-500 to-orange-500
        text-white border-2 border-purple-500
        shadow-lg
        ${isHovered ? 'transform scale-105' : ''}
        ${isPressed ? 'scale-95' : ''}
      `;
    
    case 'ghost':
      return `${baseClasses}
        bg-transparent text-purple-600 border-2 border-purple-600
        hover:bg-purple-600 hover:text-white
        ${isHovered ? 'transform scale-105' : ''}
        ${isPressed ? 'scale-95' : ''}
      `;
    
    default:
      return getVariantClasses('primary', isHovered, isPressed);
  }
};

// Configuration of size classes
const getSizeClasses = (size: MagicalButtonSize): any => {
  switch (size) {
    case 'small':
      return 'px-4 py-2 text-sm rounded-lg';
    case 'medium':
      return 'px-6 py-3 text-base rounded-xl';
    case 'large':
      return 'px-8 py-4 text-lg rounded-xl';
    case 'magical':
      return 'px-10 py-5 text-xl rounded-2xl';
    default:
      return getSizeClasses('medium');
  }
};

// Sparkle component for hover effects
const Sparkle: React.FC<{ delay: number; prefersReducedMotion?: boolean }> = ({ delay, prefersReducedMotion = false }) => (
  <motion.div
    className="absolute w-2 h-2 bg-yellow-300 rounded-full"
    initial={{ scale: 0, opacity: 0 }}
    animate={prefersReducedMotion ? { 
      scale: 1, 
      opacity: 1
    } : { 
      scale: [0, 1, 0], 
      opacity: [0, 1, 0],
      x: [0, Math.random() * 20 - 10],
      y: [0, Math.random() * 20 - 10]
    }}
    transition={prefersReducedMotion ? { 
      duration: 0.01
    } : { 
      duration: 1, 
      delay,
      repeat: Infinity,
      repeatDelay: 2
    }}
  />
);

// Ripple effect component
const Ripple: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <motion.div
    className="absolute w-4 h-4 bg-white rounded-full opacity-50"
    style={{ left: x - 8, top: y - 8 }}
    initial={{ scale: 0, opacity: 0.5 }}
    animate={{ scale: 20, opacity: 0 }}
    transition={{ duration: 0.6 }}
  />
);

export const MagicalButton: React.FC<MagicalButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className = '',
  sparkleOnHover = true,
  soundEffect = false,
  pulseOnClick = true,
  showRipple = true,
  icon,
  iconPosition = 'left',
  tooltip,
  'data-testid': dataTestId
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [rippleId, setRippleId] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    if (showRipple && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const newRipple = { id: rippleId, x, y };
      setRipples(prev => [...prev, newRipple]);
      setRippleId(prev => prev + 1);
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }

    onClick?.(event);
  }, [disabled, loading, onClick, showRipple, rippleId]);

  const handleMouseEnter = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(true);
    onMouseEnter?.(event);
  }, [onMouseEnter]);

  const handleMouseLeave = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false);
    setIsPressed(false);
    onMouseLeave?.(event);
  }, [onMouseLeave]);

  const handleMouseDown = useCallback(() => {
    if (!disabled && !loading) {
      setIsPressed(true);
    }
  }, [disabled, loading]);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const buttonClasses = `
    ${getVariantClasses(variant, isHovered, isPressed)}
    ${getSizeClasses(size)}
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${loading ? 'cursor-wait' : ''}
    ${className}
  `;

  return (
    <div className="relative">
      <motion.button
        ref={buttonRef}
        className={buttonClasses}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        disabled={disabled || loading}
        data-testid={dataTestId}
        whileHover={!prefersReducedMotion && !disabled && !loading ? { scale: 1.02 } : {}}
        whileTap={!prefersReducedMotion && !disabled && !loading ? { scale: 0.98 } : {}}
        title={tooltip}
      >
        {/* Background gradient animation */}
        {!prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: isHovered ? '100%' : '-100%' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
        )}

        {/* Content */}
        <div className="relative z-10 flex items-center justify-center gap-2">
          {icon && iconPosition === 'left' && (
            <motion.div
              initial={prefersReducedMotion ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.3 }}
            >
              {icon}
            </motion.div>
          )}
          
          <span>{children}</span>
          
          {icon && iconPosition === 'right' && (
            <motion.div
              initial={prefersReducedMotion ? { scale: 1, rotate: 0 } : { scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.3 }}
            >
              {icon}
            </motion.div>
          )}
        </div>

        {/* Loading spinner */}
        {loading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
              animate={prefersReducedMotion ? { rotate: 0 } : { rotate: 360 }}
              transition={prefersReducedMotion ? {} : { duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}

        {/* Ripples */}
        <AnimatePresence>
          {ripples.map(ripple => (
            <Ripple key={ripple.id} x={ripple.x} y={ripple.y} />
          ))}
        </AnimatePresence>
      </motion.button>

      {/* Sparkles on hover */}
      {!prefersReducedMotion && sparkleOnHover && isHovered && !disabled && !loading && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 6 }, (_, i) => (
            <Sparkle key={i} delay={i * 0.1} prefersReducedMotion={prefersReducedMotion} />
          ))}
        </div>
      )}
    </div>
  );
};
