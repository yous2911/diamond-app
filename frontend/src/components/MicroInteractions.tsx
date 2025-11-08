import React, { useCallback, useState, memo } from 'react';
import { motion, useAnimation, useTransform, useMotionValue } from 'framer-motion';
import { useGPUPerformance } from '../hooks/useGPUPerformance';
import { useReducedMotion } from '../hooks/useReducedMotion';

// =============================================================================
// 🎭 WORLD-CLASS MICRO-INTERACTIONS SYSTEM
// =============================================================================

interface MicroInteractionProps {
  children: React.ReactNode;
  type?: 'button' | 'card' | 'input' | 'icon' | 'surface';
  intensity?: 'subtle' | 'medium' | 'high' | 'epic';
  haptic?: boolean;
  sound?: boolean;
  className?: string;
  onClick?: () => void;
  onHover?: () => void;
}

// Haptic feedback simulation
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50]
    };
    navigator.vibrate(patterns[type]);
  }
  
  // Visual haptic simulation for desktop
  document.body.style.transform = 'translateY(-0.5px)';
  setTimeout(() => {
    document.body.style.transform = '';
  }, 50);
};

// Sound feedback
const playInteractionSound = (type: 'hover' | 'click' | 'success' | 'error') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    
    const frequencies = {
      hover: 800,
      click: 1000,
      success: 1200,
      error: 400
    };
    
    oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime);
    oscillator.type = 'sine';
    
    gain.gain.setValueAtTime(0.1, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    // Fallback: silent
  }
};

const MicroInteraction = memo<MicroInteractionProps>(({
  children,
  type = 'button',
  intensity = 'medium',
  haptic = true,
  sound = true,
  className = '',
  onClick,
  onHover
}) => {
  const { 
    getOptimalDuration, 
    shouldUseComplexAnimation,
    canUseBlur,
    canUseShadows,
    performanceTier 
  } = useGPUPerformance();
  
  const prefersReducedMotion = useReducedMotion();
  
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPressed, setIsPressed] = useState(false);
  
  // Motion values for smooth interactions
  const scale = useMotionValue(1);
  const brightness = useMotionValue(1);
  const blur = useMotionValue(0);
  
  // Mouse position for cursor following effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Transform values based on mouse position
  const rotateX = useTransform(mouseY, [-100, 100], [5, -5]);
  const rotateY = useTransform(mouseX, [-100, 100], [-5, 5]);
  
  const controls = useAnimation();
  const rippleControls = useAnimation();
  
  // Adaptive animation configurations based on performance and accessibility
  const getAnimationConfig = useCallback(() => {
    const baseDuration = 0.3;
    const duration = getOptimalDuration(baseDuration * 1000) / 1000;
    
    // If reduced motion, return minimal animations
    if (prefersReducedMotion) {
      return {
        scale: { hover: 1, press: 1 },
        rotate: { hover: 0, press: 0 },
        duration: 0.1,
        spring: { damping: 20, stiffness: 300 }
      };
    }
    
    const configs = {
      subtle: {
        scale: { hover: 1.02, press: 0.98 },
        rotate: { hover: 0, press: 0 },
        duration,
        spring: { damping: 20, stiffness: 300 }
      },
      medium: {
        scale: { hover: 1.05, press: 0.95 },
        rotate: { hover: 1, press: -1 },
        duration,
        spring: { damping: 25, stiffness: 400 }
      },
      high: {
        scale: { hover: 1.08, press: 0.92 },
        rotate: { hover: 2, press: -2 },
        duration,
        spring: { damping: 30, stiffness: 500 }
      },
      epic: {
        scale: { hover: 1.12, press: 0.88 },
        rotate: { hover: 3, press: -3 },
        duration: duration * 0.8,
        spring: { damping: 35, stiffness: 600 }
      }
    };
    
    return configs[intensity];
  }, [intensity, getOptimalDuration, prefersReducedMotion]);

  // Mouse enter handler with performance-adaptive effects
  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    setIsHovered(true);
    onHover?.();
    
    if (sound && performanceTier !== 'low') {
      playInteractionSound('hover');
    }
    
    const config = getAnimationConfig();
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
    
    // Primary animations
    controls.start({
      scale: config.scale.hover,
      rotate: config.rotate.hover,
      transition: { 
        type: "spring", 
        ...config.spring,
        duration: config.duration 
      }
    });
    
    // Advanced effects for high-performance devices
    if (shouldUseComplexAnimation()) {
      brightness.set(1.1);
      
      if (canUseBlur && performanceTier === 'ultra') {
        blur.set(0.5);
      }
      
      // Magnetic attraction effect
      if (type === 'button' && intensity === 'epic') {
        controls.start({
          x: (e.clientX - centerX) * 0.1,
          y: (e.clientY - centerY) * 0.1,
          transition: { duration: config.duration }
        });
      }
    }
  }, [
    onHover, 
    sound, 
    performanceTier, 
    getAnimationConfig, 
    mouseX, 
    mouseY, 
    controls, 
    shouldUseComplexAnimation, 
    canUseBlur, 
    brightness, 
    blur, 
    type, 
    intensity
  ]);

  // Mouse leave handler
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    
    const config = getAnimationConfig();
    
    controls.start({
      scale: 1,
      rotate: 0,
      x: 0,
      y: 0,
      transition: { 
        type: "spring", 
        ...config.spring,
        duration: config.duration * 1.2 
      }
    });
    
    brightness.set(1);
    blur.set(0);
  }, [controls, getAnimationConfig, brightness, blur]);

  // Mouse down handler
  const handleMouseDown = useCallback(() => {
    setIsPressed(true);
    
    if (haptic && performanceTier !== 'low') {
      triggerHaptic('light');
    }
    
    const config = getAnimationConfig();
    
    controls.start({
      scale: config.scale.press,
      rotate: config.rotate.press,
      transition: { duration: 0.1 }
    });
    
    // Ripple effect for buttons
    if (type === 'button' && shouldUseComplexAnimation()) {
      rippleControls.start({
        scale: [0, 4],
        opacity: [0.6, 0],
        transition: { duration: 0.6 }
      });
    }
  }, [haptic, performanceTier, getAnimationConfig, controls, type, shouldUseComplexAnimation, rippleControls]);

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
    
    if (sound && performanceTier !== 'low') {
      playInteractionSound('click');
    }
    
    const config = getAnimationConfig();
    
    controls.start({
      scale: isHovered ? config.scale.hover : 1,
      rotate: isHovered ? config.rotate.hover : 0,
      transition: { 
        type: "spring", 
        damping: 15, 
        stiffness: 300 
      }
    });
  }, [sound, performanceTier, getAnimationConfig, controls, isHovered]);

  // Click handler with loading state
  const handleClick = useCallback(async () => {
    if (onClick) {
      setIsLoading(true);
      
      try {
        await onClick();
        
        if (sound) {
          playInteractionSound('success');
        }
        
        // Success animation
        controls.start({
          scale: [1, 1.1, 1],
          rotate: [0, 5, 0],
          transition: { duration: 0.4 }
        });
        
      } catch (error) {
        if (sound) {
          playInteractionSound('error');
        }
        
        // Error shake animation
        controls.start({
          x: [0, -10, 10, -10, 10, 0],
          transition: { duration: 0.5 }
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, [onClick, sound, controls]);

  // Loading spinner for async operations
  const LoadingSpinner = memo(() => (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-inherit"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  ));

  // Dynamic class generation based on performance
  const getInteractionClasses = useCallback(() => {
    let classes = className;
    
    if (canUseShadows) {
      classes += ' shadow-lg hover:shadow-xl';
    }
    
    if (canUseBlur && performanceTier === 'ultra') {
      classes += ' backdrop-blur-sm';
    }
    
    if (type === 'button') {
      classes += ' cursor-pointer select-none';
    }
    
    return classes;
  }, [className, canUseShadows, canUseBlur, performanceTier, type]);

  return (
    <motion.div
      className={`relative overflow-hidden ${getInteractionClasses()}`}
      animate={controls}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      style={{
        scale,
        rotateX: !prefersReducedMotion && shouldUseComplexAnimation() && intensity === 'epic' ? rotateX : 0,
        rotateY: !prefersReducedMotion && shouldUseComplexAnimation() && intensity === 'epic' ? rotateY : 0,
        filter: canUseBlur ? `brightness(${brightness.get()}) blur(${blur.get()}px)` : `brightness(${brightness.get()})`,
        transformStyle: 'preserve-3d',
        transformOrigin: 'center center'
      }}
      whileTap={!prefersReducedMotion && performanceTier !== 'low' ? { scale: getAnimationConfig().scale.press } : undefined}
    >
      {/* Content */}
      {children}
      
      {/* Ripple effect for buttons */}
      {type === 'button' && shouldUseComplexAnimation() && (
        <motion.div
          className="absolute inset-0 bg-white/20 rounded-full pointer-events-none"
          style={{ transformOrigin: 'center center' }}
          animate={rippleControls}
          initial={{ scale: 0, opacity: 0 }}
        />
      )}
      
      {/* Loading overlay */}
      {isLoading && <LoadingSpinner />}
      
      {/* Glow effect for epic intensity */}
      {intensity === 'epic' && isHovered && shouldUseComplexAnimation() && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-inherit pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ filter: canUseBlur ? 'blur(8px)' : 'none' }}
        />
      )}
      
      {/* Debug performance indicator (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 right-0 bg-black/50 text-white text-xs px-1 rounded-bl pointer-events-none">
          {performanceTier}
        </div>
      )}
    </motion.div>
  );
});

MicroInteraction.displayName = 'MicroInteraction';

export default MicroInteraction;