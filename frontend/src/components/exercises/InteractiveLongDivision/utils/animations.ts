// =============================================================================
// ANIMATION VARIANTS FOR INTERACTIVE LONG DIVISION
// =============================================================================

import { Variants } from 'framer-motion';

export const slideIn: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    scale: 0.95,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

export const smoothAppear: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    transition: { type: "spring", stiffness: 300, damping: 25 }
  }
};

export const numberDrop: Variants = {
  initial: { y: -30, opacity: 0, scale: 1.2 },
  animate: { 
    y: 0, 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 }
  }
};

export const celebration: Variants = {
  initial: { scale: 0, rotate: 0 },
  animate: { 
    scale: [0, 1.2, 1], 
    rotate: [0, 10, -10, 0],
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

export const pulse: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

