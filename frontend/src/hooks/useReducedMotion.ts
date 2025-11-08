import { useState, useEffect } from 'react';

// =============================================================================
// ♿ REDUCED MOTION HOOK - ACCESSIBILITY SUPPORT
// =============================================================================

/**
 * Hook to detect if user prefers reduced motion
 * Respects the prefers-reduced-motion media query
 * 
 * @returns boolean - true if user prefers reduced motion
 * 
 * @example
 * const prefersReducedMotion = useReducedMotion();
 * 
 * <motion.div
 *   animate={prefersReducedMotion ? {} : { scale: [1, 1.2, 1] }}
 * />
 */
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if media query is supported
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    // Create media query
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Create event handler
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setPrefersReducedMotion(event.matches);
    };

    // Add listener (modern browsers)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      
      return () => {
        mediaQuery.removeListener(handleChange);
      };
    }
  }, []);

  return prefersReducedMotion;
};

/**
 * Hook to get animation variants that respect reduced motion
 * Returns empty variants if user prefers reduced motion
 * 
 * @param variants - Animation variants object
 * @returns Variants object or empty object if reduced motion preferred
 * 
 * @example
 * const variants = useReducedMotionVariants({
 *   initial: { opacity: 0, y: 20 },
 *   animate: { opacity: 1, y: 0 }
 * });
 */
export const useReducedMotionVariants = <T extends Record<string, any>>(
  variants: T
): T | Record<string, any> => {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    // Return minimal variants (only opacity, no transforms)
    const minimalVariants: Record<string, any> = {};
    
    Object.keys(variants).forEach((key) => {
      minimalVariants[key] = {
        opacity: variants[key]?.opacity ?? 1,
        // Remove all transform properties
        x: undefined,
        y: undefined,
        z: undefined,
        scale: undefined,
        rotate: undefined,
        rotateX: undefined,
        rotateY: undefined,
        rotateZ: undefined,
        // Keep transition if it exists
        transition: variants[key]?.transition,
      };
    });
    
    return minimalVariants;
  }
  
  return variants;
};

/**
 * Hook to get animation duration that respects reduced motion
 * Returns shorter duration if user prefers reduced motion
 * 
 * @param duration - Normal duration in seconds
 * @param reducedDuration - Duration for reduced motion (default: 0.1)
 * @returns Duration in seconds
 * 
 * @example
 * const duration = useReducedMotionDuration(0.5);
 * // Returns 0.1 if reduced motion, 0.5 otherwise
 */
export const useReducedMotionDuration = (
  duration: number,
  reducedDuration: number = 0.1
): number => {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? reducedDuration : duration;
};

/**
 * Hook to conditionally apply animation based on reduced motion preference
 * 
 * @param animation - Animation object or function
 * @param fallback - Fallback animation for reduced motion
 * @returns Animation object
 * 
 * @example
 * const animation = useReducedMotionAnimation(
 *   { scale: [1, 1.2, 1], rotate: [0, 360, 0] },
 *   { opacity: [0, 1] }
 * );
 */
export const useReducedMotionAnimation = <T extends Record<string, any>>(
  animation: T | (() => T),
  fallback?: Partial<T>
): T | Partial<T> => {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return fallback ?? {};
  }
  
  return typeof animation === 'function' ? animation() : animation;
};

